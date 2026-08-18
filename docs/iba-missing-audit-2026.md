# IBA Missing Recipe Audit — 2026 baseline

Audit target: the live IBA Official Cocktail List as exposed on iba-world.com in August 2026.

Important note: the live IBA website currently exposes 102 cocktails (34 Unforgettables, 34 Contemporary Classics, 34 New Era), while IBA marketing for its 2026 book describes a collection of 101 cocktails. For Virtual Bartender catalog comparison, this audit uses the live website list.

Virtual Bartender baseline: 250 built-in recipes in the generated Web catalog at the time of audit.

## Summary

- Exact normalized name matches: 39
- Clear alternate-name matches already present: 3
- Not currently present as an exact or clear alternate-name recipe: 60

Clear alternate-name matches:
- Alexander → Brandy Alexander
- South Side → Southside
- Spritz → Aperol Spritz

## Missing — Unforgettables (18)

- Angel Face
- Between the Sheets
- Brandy Crusta
- Casino
- Clover Club
- Gin Fizz
- Hanky Panky
- Martinez
- Mary Pickford
- Monkey Gland
- Paradise
- Porto Flip
- Ramos Fizz
- Remember the Maine
- Stinger
- Tuxedo
- Vieux Carré
- White Lady

## Missing — Contemporary Classics (17)

- Caipirinha
- Cardinale
- Corpse Reviver #2
- French Connection
- Garibaldi
- Grasshopper
- Hemingway Special
- Horse’s Neck
- Kir
- Lemon Drop Martini
- Long Island Iced Tea
- Mimosa
- Pisco Sour
- Rabo de Galo
- Singapore Sling
- Vesper
- Zombie

## Missing — New Era (25)

- Canchanchara
- Chartreuse Swizzle
- Don's Special Daiquiri
- Fernandito
- French Martini
- Gin Basil Smash
- Grand Margarita
- IBA Tiki
- Illegal
- Jungle Bird
- Missionary's Downfall
- Naked and Famous
- New York Sour
- Old Cuban
- Pisco Punch
- Porn Star Martini
- Russian Spring Punch
- Sherry Cobbler
- Spicy Fifty
- Suffering Bastard
- Three Dots and a Dash
- Tipperary
- Tommy's Margarita
- Trinidad Sour
- Ve.N.To

## Duplicate / variant handling rules

Before adding any recipe from this list:

1. Compare its normalized name against every existing built-in recipe.
2. Check likely alternate spellings, punctuation, and common alternate names.
3. Compare the ingredient formula against similar existing recipes.
4. If it is the same drink with only naming differences, keep one canonical recipe and record the alternate name.
5. If it is a recognized distinct formula (for example Tommy's Margarita versus Margarita), preserve it as a linked variant rather than treating it as a duplicate.
6. Do not add multiple copies merely because multiple reference websites publish the same drink.

## Image plan

Recipe images are intentionally not copied from IBA, Good Food, Difford's, Liquor.com, or other recipe websites. Images should be either appropriately licensed for reuse or created specifically for Virtual Bartender, with image metadata kept optional so every edition remains fully functional offline without artwork.
