import { recipe } from "./catalogHelpers";

const SRC = "Virtual Bartender curated recipe";
const URL = "local://virtual-bartender/curated";
const highball = (key: string, name: string, spirit: string, mixer: string) =>
  recipe(key, name, "cocktail", `${name} served over ice.`, `Build ${spirit.toLowerCase()} and ${mixer.toLowerCase()} over ice and stir gently.`, SRC, URL, [[spirit, 2, "oz", false], [mixer, 4, "oz", false]]);

// V5 is the largest catalog generation. It is migrated in audited sections
// so every canonical entry can be checked before the complete set is enabled.
export const RECIPES_V5_PART_1 = [
  highball("brandy-cola", "Brandy and Cola", "Brandy", "Cola"),
  highball("brandy-ginger", "Brandy Ginger", "Brandy", "Ginger Ale"),
  highball("brandy-soda", "Brandy Soda", "Brandy", "Club Soda"),
  highball("cognac-cola", "Cognac and Cola", "Cognac", "Cola"),
  highball("cognac-ginger", "Cognac Ginger", "Cognac", "Ginger Ale"),
  highball("cognac-tonic", "Cognac Tonic", "Cognac", "Tonic Water"),
  highball("irish-whiskey-ginger", "Irish Whiskey Ginger", "Irish Whiskey", "Ginger Ale"),
  highball("irish-whiskey-cola", "Irish Whiskey Cola", "Irish Whiskey", "Cola"),
  highball("irish-whiskey-soda", "Irish Whiskey Soda", "Irish Whiskey", "Club Soda"),
  highball("scotch-ginger", "Scotch Ginger", "Scotch Whisky", "Ginger Ale"),
  highball("scotch-cola", "Scotch and Cola", "Scotch Whisky", "Cola"),
  highball("scotch-tonic", "Scotch Tonic", "Scotch Whisky", "Tonic Water"),
  highball("dark-rum-cola", "Dark Rum and Cola", "Dark Rum", "Cola"),
  highball("dark-rum-ginger", "Dark Rum Ginger", "Dark Rum", "Ginger Ale"),
  highball("dark-rum-tonic", "Dark Rum Tonic", "Dark Rum", "Tonic Water"),
  highball("gold-rum-cola", "Gold Rum and Cola", "Gold Rum", "Cola"),
  highball("gold-rum-ginger", "Gold Rum Ginger", "Gold Rum", "Ginger Ale"),
  highball("gold-rum-tonic", "Gold Rum Tonic", "Gold Rum", "Tonic Water"),
  highball("reposado-tonic", "Reposado Tonic", "Reposado Tequila", "Tonic Water"),
  highball("reposado-ginger", "Reposado Ginger", "Reposado Tequila", "Ginger Ale"),
  highball("reposado-cola", "Reposado and Cola", "Reposado Tequila", "Cola"),
  highball("mezcal-tonic", "Mezcal Tonic", "Mezcal", "Tonic Water"),
  highball("mezcal-soda", "Mezcal Soda", "Mezcal", "Club Soda"),
  highball("mezcal-ginger", "Mezcal Ginger", "Mezcal", "Ginger Ale"),
  highball("aperol-soda", "Aperol Soda", "Aperol", "Club Soda"),
  highball("campari-soda", "Campari Soda", "Campari", "Club Soda"),
  highball("campari-orange", "Campari Orange", "Campari", "Orange Juice"),
  highball("amaretto-cola", "Amaretto and Cola", "Amaretto", "Cola"),
  highball("amaretto-ginger", "Amaretto Ginger", "Amaretto", "Ginger Ale"),
  highball("coffee-liqueur-cola", "Coffee Liqueur and Cola", "Coffee Liqueur", "Cola"),
  highball("brandy-orange", "Brandy Orange", "Brandy", "Orange Juice"),
  highball("brandy-pineapple", "Brandy Pineapple", "Brandy", "Pineapple Juice"),
  highball("cognac-orange", "Cognac Orange", "Cognac", "Orange Juice"),
];
