export interface CatalogIngredient {
  id: string;
  name: string;
  category: string;
}

function stableId(name: string): string {
  return `builtin:${name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

const RAW: Array<[string, string]> = [
  ["Bourbon", "Whiskey"], ["Rye Whiskey", "Whiskey"], ["Scotch Whisky", "Whiskey"],
  ["Gin", "Spirits"], ["Vodka", "Spirits"], ["White Rum", "Rum"], ["Dark Rum", "Rum"],
  ["Blanco Tequila", "Tequila"], ["Reposado Tequila", "Tequila"], ["Triple Sec", "Liqueurs"],
  ["Cointreau", "Liqueurs"], ["Sweet Vermouth", "Fortified Wine"], ["Dry Vermouth", "Fortified Wine"],
  ["Campari", "Liqueurs"], ["Angostura Bitters", "Bitters"], ["Simple Syrup", "Syrups"],
  ["Grenadine", "Syrups"], ["Lime Juice", "Juices"], ["Lemon Juice", "Juices"],
  ["Orange Juice", "Juices"], ["Grapefruit Juice", "Juices"], ["Pineapple Juice", "Juices"],
  ["Ginger Beer", "Mixers"], ["Ginger Ale", "Mixers"], ["Tonic Water", "Mixers"],
  ["Club Soda", "Mixers"], ["Cola", "Mixers"], ["Sprite", "Mixers"], ["Mint Leaves", "Fresh Ingredients"],
  ["Orange Peel", "Garnishes"], ["Lime Wedge", "Garnishes"], ["Lemon Peel", "Garnishes"],
  ["Salt", "Pantry / Kitchen"], ["Sugar", "Pantry / Kitchen"], ["Egg White", "Fresh Ingredients"],
  ["Brandy", "Spirits"], ["Cognac", "Brandy"], ["Irish Whiskey", "Whiskey"],
  ["Canadian Whisky", "Whiskey"], ["Aged Rum", "Rum"], ["Gold Rum", "Rum"],
  ["Overproof Rum", "Rum"], ["Mezcal", "Tequila / Agave"], ["Coffee Liqueur", "Liqueurs"],
  ["Amaretto", "Liqueurs"], ["Aperol", "Liqueurs"], ["Maraschino Liqueur", "Liqueurs"],
  ["Green Chartreuse", "Liqueurs"], ["Crème de Cacao", "Liqueurs"], ["Crème de Menthe", "Liqueurs"],
  ["Peach Schnapps", "Liqueurs"], ["Blue Curaçao", "Liqueurs"], ["Falernum", "Liqueurs"],
  ["Absinthe", "Liqueurs"], ["Prosecco", "Wine / Sparkling"], ["Champagne", "Wine / Sparkling"],
  ["Red Wine", "Wine / Sparkling"], ["Cream", "Dairy"], ["Milk", "Dairy"],
  ["Coconut Cream", "Mixers"], ["Tomato Juice", "Juices"], ["Cranberry Juice", "Juices"],
  ["Passion Fruit Puree", "Fresh Ingredients"], ["Strawberries", "Fresh Ingredients"],
  ["Raspberries", "Fresh Ingredients"], ["Cucumber", "Fresh Ingredients"], ["Basil Leaves", "Fresh Ingredients"],
  ["Celery Salt", "Pantry / Kitchen"], ["Black Pepper", "Pantry / Kitchen"], ["Hot Sauce", "Pantry / Kitchen"],
  ["Worcestershire Sauce", "Pantry / Kitchen"], ["Honey Syrup", "Syrups"], ["Agave Syrup", "Syrups"],
  ["Orgeat", "Syrups"], ["Demerara Syrup", "Syrups"], ["Vanilla Syrup", "Syrups"],
  ["Raspberry Syrup", "Syrups"], ["Grapefruit Soda", "Mixers"], ["Lemon-Lime Soda", "Mixers"],
  ["Root Beer", "Mixers"], ["Coffee", "Mixers"], ["Espresso", "Mixers"], ["Water", "Mixers"],
  ["Orange Bitters", "Bitters"], ["Peychaud's Bitters", "Bitters"], ["Orange Slice", "Garnishes"],
  ["Lemon Wedge", "Garnishes"], ["Cherry", "Garnishes"], ["Pineapple Wedge", "Garnishes"],
  ["Mint Sprig", "Garnishes"]
];

export const BUILTIN_INGREDIENTS: CatalogIngredient[] = RAW
  .map(([name, category]) => ({ id: stableId(name), name, category }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const BUILTIN_INGREDIENTS_BY_ID = new Map(BUILTIN_INGREDIENTS.map((item) => [item.id, item]));
