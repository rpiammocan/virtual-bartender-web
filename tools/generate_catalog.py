#!/usr/bin/env python3
"""Generate the browser-native Virtual Bartender catalog from canonical sources.

CasaOS is canonical. This tool downloads the source files, parses only literal
assignments via Python's AST, validates the combined catalog, carries canonical
recipe-image metadata into the browser catalog, and can sync the corresponding
static image files for a GitHub Pages build.
"""

from __future__ import annotations

import argparse
import ast
import json
import pathlib
import urllib.request
from collections import Counter
from typing import Any

BASE = "https://raw.githubusercontent.com/rpiammocan/virtual-bartender-casaos/main/backend/app"
MEDIA_BASE = "https://raw.githubusercontent.com/rpiammocan/virtual-bartender-casaos/main"
SOURCES = [
    ("seed.py", None),
    ("catalog_v2.py", "RECIPES_V2"),
    ("catalog_v3.py", "RECIPES_V3"),
    ("catalog_v4.py", "RECIPES_V4"),
    ("catalog_v5.py", "RECIPES_V5"),
    ("catalog_v6.py", "RECIPES_V6"),
    ("catalog_v7.py", "RECIPES_V7"),
    ("catalog_v8.py", "RECIPES_V8"),
]


def fetch_text(name: str) -> str:
    with urllib.request.urlopen(f"{BASE}/{name}", timeout=30) as response:
        return response.read().decode("utf-8")


def literal_assignments(source: str) -> dict[str, Any]:
    tree = ast.parse(source)
    values: dict[str, Any] = {}
    for node in tree.body:
        if not isinstance(node, ast.Assign) or len(node.targets) != 1:
            continue
        target = node.targets[0]
        if not isinstance(target, ast.Name):
            continue
        try:
            values[target.id] = ast.literal_eval(node.value)
        except (ValueError, TypeError):
            continue
    return values


def extract_image_metadata(seed_source: str) -> dict[str, dict[str, Any]]:
    tree = ast.parse(seed_source)
    values = literal_assignments(seed_source)
    mapping: dict[str, dict[str, Any]] = dict(values.get("IMAGE_METADATA", {}))
    for node in tree.body:
        if not isinstance(node, ast.Assign) or len(node.targets) != 1:
            continue
        target = node.targets[0]
        if not isinstance(target, ast.Subscript):
            continue
        if not isinstance(target.value, ast.Name) or target.value.id != "IMAGE_METADATA":
            continue
        try:
            key = ast.literal_eval(target.slice)
            value = ast.literal_eval(node.value)
        except (ValueError, TypeError):
            continue
        if isinstance(key, str) and isinstance(value, dict):
            mapping[key] = value
    return mapping


def find_base_recipes(assignments: dict[str, Any]) -> list[dict[str, Any]]:
    candidates: list[tuple[str, list[dict[str, Any]]]] = []
    for name, value in assignments.items():
        if not isinstance(value, list) or not value:
            continue
        if not all(isinstance(item, dict) for item in value):
            continue
        if not all("key" in item and "ingredients" in item for item in value):
            continue
        candidates.append((name, value))
    if not candidates:
        raise RuntimeError("Could not locate base recipe list in seed.py")
    candidates.sort(key=lambda pair: ("recipe" not in pair[0].lower(), -len(pair[1])))
    return candidates[0][1]


def normalize_recipe(raw: dict[str, Any], image_meta: dict[str, Any] | None = None) -> dict[str, Any]:
    ingredients = []
    for name, quantity, unit, optional in raw["ingredients"]:
        ingredients.append({"ingredientName": name, "quantity": quantity, "unit": unit, "optional": bool(optional)})
    recipe = {
        "key": raw["key"],
        "name": raw["name"],
        "type": raw.get("type", "cocktail"),
        "version": raw.get("version", "1.0"),
        "description": raw.get("description", ""),
        "instructions": raw.get("instructions", ""),
        "source": raw.get("source", ""),
        "sourceUrl": raw.get("url", ""),
        "parentKey": raw.get("parent"),
        "ingredients": ingredients,
    }
    if image_meta:
        recipe.update({
            "imagePath": image_meta.get("image_path"),
            "imageSourceUrl": image_meta.get("image_source_url"),
            "imageLicense": image_meta.get("image_license"),
            "imageAttribution": image_meta.get("image_attribution"),
            "imageAiGenerated": bool(image_meta.get("image_ai_generated")),
        })
    return recipe


def load_catalog() -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    combined: list[dict[str, Any]] = []
    seed_source = fetch_text("seed.py")
    image_metadata = extract_image_metadata(seed_source)
    for filename, variable in SOURCES:
        source = seed_source if filename == "seed.py" else fetch_text(filename)
        assignments = literal_assignments(source)
        recipes = assignments[variable] if variable else find_base_recipes(assignments)
        combined.extend(normalize_recipe(recipe, image_metadata.get(recipe["key"])) for recipe in recipes)
    return combined, image_metadata


def validate(recipes: list[dict[str, Any]]) -> None:
    keys = [recipe["key"] for recipe in recipes]
    duplicates = sorted(key for key, count in Counter(keys).items() if count > 1)
    if duplicates:
        raise RuntimeError(f"Duplicate recipe keys: {', '.join(duplicates)}")
    key_set = set(keys)
    missing_parents = sorted({recipe["parentKey"] for recipe in recipes if recipe.get("parentKey") and recipe["parentKey"] not in key_set})
    if missing_parents:
        raise RuntimeError(f"Missing parent recipes: {', '.join(missing_parents)}")
    for recipe in recipes:
        if not recipe["ingredients"]:
            raise RuntimeError(f"Recipe has no ingredients: {recipe['key']}")
        for ingredient in recipe["ingredients"]:
            if not ingredient["ingredientName"]:
                raise RuntimeError(f"Blank ingredient in recipe: {recipe['key']}")


def media_candidates(image_path: str) -> list[str]:
    filename = pathlib.PurePosixPath(image_path).name
    return [
        f"frontend/public/media/{filename}",
        f"data/images/{filename}",
    ]


def download_binary(relative_path: str) -> bytes:
    url = f"{MEDIA_BASE}/{relative_path}"
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read()


def sync_images(recipes: list[dict[str, Any]], output_dir: pathlib.Path) -> tuple[int, list[str]]:
    output_dir.mkdir(parents=True, exist_ok=True)
    wanted = {pathlib.PurePosixPath(r["imagePath"]).name for r in recipes if r.get("imagePath")}
    copied = 0
    missing: list[str] = []
    for filename in sorted(wanted):
        destination = output_dir / filename
        data = None
        for candidate in [f"frontend/public/media/{filename}", f"data/images/{filename}"]:
            try:
                data = download_binary(candidate)
                break
            except Exception:
                continue
        if data is None:
            missing.append(filename)
            continue
        destination.write_bytes(data)
        copied += 1
    for path in output_dir.iterdir():
        if path.is_file() and path.name not in wanted:
            path.unlink()
    return copied, missing


def emit_typescript(recipes: list[dict[str, Any]]) -> str:
    payload = json.dumps(recipes, ensure_ascii=False, indent=2)
    return (
        "// AUTO-GENERATED by tools/generate_catalog.py. DO NOT EDIT BY HAND.\n"
        "import type { CatalogRecipe } from './recipes';\n"
        "import { ingredientId } from './catalogHelpers';\n\n"
        f"const RAW = {payload} as const;\n\n"
        "export const BUILTIN_RECIPES: CatalogRecipe[] = RAW.map((recipe) => ({\n"
        "  ...recipe,\n"
        "  parentKey: recipe.parentKey ?? undefined,\n"
        "  imagePath: 'imagePath' in recipe ? recipe.imagePath ?? undefined : undefined,\n"
        "  imageSourceUrl: 'imageSourceUrl' in recipe ? recipe.imageSourceUrl ?? undefined : undefined,\n"
        "  imageLicense: 'imageLicense' in recipe ? recipe.imageLicense ?? undefined : undefined,\n"
        "  imageAttribution: 'imageAttribution' in recipe ? recipe.imageAttribution ?? undefined : undefined,\n"
        "  imageAiGenerated: 'imageAiGenerated' in recipe ? Boolean(recipe.imageAiGenerated) : false,\n"
        "  ingredients: recipe.ingredients.map((item) => ({\n"
        "    ...item,\n"
        "    ingredientId: ingredientId(item.ingredientName),\n"
        "  })),\n"
        "}));\n\n"
        "export const BUILTIN_RECIPES_BY_KEY = new Map(\n"
        "  BUILTIN_RECIPES.map((recipe) => [recipe.key, recipe]),\n"
        ");\n"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="src/catalog/generatedCatalog.ts", help="TypeScript output path")
    parser.add_argument("--check-only", action="store_true")
    parser.add_argument("--sync-images", help="Directory to populate with canonical recipe images")
    args = parser.parse_args()
    recipes, _image_metadata = load_catalog()
    validate(recipes)
    cocktails = sum(recipe["type"] == "cocktail" for recipe in recipes)
    mocktails = sum(recipe["type"] == "mocktail" for recipe in recipes)
    images = sum(bool(recipe.get("imagePath")) for recipe in recipes)
    ai_images = sum(bool(recipe.get("imageAiGenerated")) for recipe in recipes)
    print(f"Validated {len(recipes)} recipes: {cocktails} cocktails, {mocktails} mocktails, {images} images ({ai_images} AI)")
    if args.sync_images:
        copied, missing = sync_images(recipes, pathlib.Path(args.sync_images))
        print(f"Synced {copied} canonical images to {args.sync_images}")
        if missing:
            raise RuntimeError(f"Could not sync {len(missing)} image(s): {', '.join(missing)}")
    if not args.check_only:
        output = pathlib.Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(emit_typescript(recipes), encoding="utf-8")
        print(f"Wrote {output}")


if __name__ == "__main__":
    main()
