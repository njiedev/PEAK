import type { Route } from '../shared/schema'

// Hand-crafted example route used by FS2 while real generation is being built.
// Keep in sync with shared/schema.ts. If the schema changes, update this the same hour.

export const mockRoute: Route = {
  skill: 'build a Minecraft mod',
  estimatedHours: 20,
  route: [
    {
      id: 1,
      title: 'Set up your modding workspace',
      summary: 'Before you can change Minecraft, you need a place to write code that Minecraft will listen to.',
      challenge: {
        type: 'photo',
        prompt: 'Install the Fabric or Forge starter project on your computer and run it once. Take a screenshot of Minecraft launching with your mod loaded (you should see your mod name in the mods list).',
      },
      difficulty: 1,
      x: 0.18,
      y: 0.92,
    },
    {
      id: 2,
      title: 'Make Minecraft say hi',
      summary: "Your first mod should do almost nothing — that's the point. If 'hello' works, anything works.",
      challenge: {
        type: 'photo',
        prompt: 'Make your mod print a message in the chat the first time the player joins a world. Screenshot the chat showing your message.',
      },
      difficulty: 1,
      x: 0.34,
      y: 0.78,
    },
    {
      id: 3,
      title: 'Add your own item',
      summary: "Items are the building blocks of mods. Once you can add one item, you can add a hundred.",
      challenge: {
        type: 'photo',
        prompt: 'Create a new item called anything you want (a "Lucky Coin," a "Spicy Pepper" — your call). Give it an icon. Screenshot it sitting in your inventory.',
      },
      difficulty: 2,
      x: 0.22,
      y: 0.66,
    },
    {
      id: 4,
      title: 'Why do mods need IDs?',
      summary: 'Every block, item, and entity has a unique name like "mymod:lucky_coin." Without it, Minecraft gets confused.',
      challenge: {
        type: 'text',
        prompt: 'In your own words, explain what would happen if two different mods both tried to add an item called "sword" with no mod ID prefix. Why does the prefix matter?',
      },
      difficulty: 2,
      x: 0.46,
      y: 0.54,
    },
    {
      id: 5,
      title: 'Make your item DO something',
      summary: 'A pretty item is fine. An item that does a thing when you right-click it is way cooler.',
      challenge: {
        type: 'photo',
        prompt: 'Make your custom item do something when the player right-clicks it (heal them, launch them up, set off particles — your choice). Record or screenshot it happening.',
      },
      difficulty: 3,
      x: 0.30,
      y: 0.42,
    },
    {
      id: 6,
      title: 'Add a custom block',
      summary: 'Blocks are like items, but they live in the world. They have textures on every side and behavior when stepped on.',
      challenge: {
        type: 'photo',
        prompt: 'Add a custom block to the game with its own texture. Place it in the world and screenshot it next to a vanilla block for comparison.',
      },
      difficulty: 3,
      x: 0.54,
      y: 0.30,
    },
    {
      id: 7,
      title: 'Craft your item',
      summary: 'Recipes are how players actually get your stuff. No recipe = no one ever finds it.',
      challenge: {
        type: 'photo',
        prompt: 'Add a crafting recipe so the player can craft your custom item from vanilla materials (like 4 sticks and a diamond). Screenshot the crafting table showing the recipe working.',
      },
      difficulty: 4,
      x: 0.38,
      y: 0.20,
    },
    {
      id: 8,
      title: 'Ship a tiny mod others can play',
      summary: 'A mod no one plays is just a folder. Building it into a real .jar makes it a real mod.',
      challenge: {
        type: 'photo',
        prompt: 'Build your mod into a .jar file, drop it into a fresh Minecraft instance\'s mods folder, and launch the game. Screenshot the title screen with your mod listed.',
      },
      difficulty: 5,
      x: 0.50,
      y: 0.08,
    },
  ],
}

export default mockRoute
