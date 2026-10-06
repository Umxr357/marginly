import type { Post } from "./types";
export const covers = {
  architecture:
    "https://images.unsplash.com/photo-1741524915487-72b1ffc828d6?auto=format&fit=crop&w=1200&h=750&q=85",
  mountains:
    "https://images.unsplash.com/photo-1622483952041-0c7854cf652b?auto=format&fit=crop&w=1200&h=750&q=85",
  workspace:
    "https://images.unsplash.com/photo-1570993492881-25240ce854f4?auto=format&fit=crop&w=1200&h=750&q=85",
};
const stories = [
  {
    id: "the-art-of-noticing",
    title: "The art of noticing: finding inspiration in the everyday",
    excerpt:
      "Sometimes the best ideas aren't found in a search bar. They're waiting in the spaces we walk past every day.",
    category: "Design",
    author: "Olivia Bennett",
    featured: 1,
    image: "/images/noticing-editorial.png",
    content:
      "We tend to imagine inspiration as an event: a flash of insight, a perfect reference, an unexpected breakthrough. More often, it begins with something quieter. A shadow on a staircase. The way a café arranges its chairs. A handwritten sign that does its job beautifully.\n\n## Pay attention before you make something\n\nA useful creative practice begins with observation. On your next walk, leave the headphones behind for ten minutes. Notice how people move through a space, what they touch, and where they pause. These small details tell you more about design than a carefully staged photograph ever could.\n\nCarry a small notebook or use your phone to record one thing each day. Describe what caught your eye and why. The explanation matters more than the image: it turns a collection of references into a record of your own thinking.\n\n## Give ordinary things a second look\n\nFamiliarity is efficient, but it can make the world disappear. Try looking at your street as if you had just arrived in a new city. Which colors repeat? Where does the light fall in the afternoon? What has been repaired instead of replaced?\n\nYou do not need to turn every observation into a project. Attention has value on its own. Over time, the details you collect become a vocabulary you can draw from without forcing a connection.\n\n## Make room for the unexpected\n\nLeave a little space in your process for wandering. Visit a library shelf outside your interests. Take a different route home. Talk to someone who makes things with their hands. Good ideas often arrive from a direction your brief never anticipated.\n\nThe everyday is where most of life happens, and where a great deal of thoughtful design begins.",
  },
  {
    id: "the-long-way-home",
    title: "In praise of taking the long way home",
    excerpt:
      "An unhurried walk through the mountains, and a reminder that not every journey needs to be optimized.",
    category: "Travel",
    author: "Maya Chen",
    featured: 0,
    image: covers.mountains,
    content:
      "There was a faster route. There almost always is. But the narrow path around the ridge promised a different view, and for once we had left enough time to be curious.\n\n## Let the landscape set the pace\n\nIn the mountains, distance is an incomplete description. A kilometer can contain a change in weather, a long conversation, or ten minutes of watching clouds move across a valley. We stopped measuring progress and started noticing where we were.\n\nUnhurried travel does not require a distant destination. It can mean spending a whole afternoon in one neighborhood, returning to the same bakery, or leaving the final hour of a day unplanned.\n\n## Bring less of an itinerary\n\nPlanning makes travel easier, but a schedule should support the experience rather than consume it. Choose a few things that matter and give them room. Leave enough space to follow a recommendation or sit somewhere simply because it feels good.\n\nWe reached the village later than expected. Nothing important had been lost. We remembered the path long after we forgot the time.",
  },
  {
    id: "tools-that-get-out-of-the-way",
    title: "The best tools get out of your way",
    excerpt:
      "What thoughtful software can learn from a well-worn notebook, a good chair, and the humble pencil.",
    category: "Technology",
    author: "Ethan Park",
    featured: 0,
    image: covers.workspace,
    content:
      "A good tool makes a task feel possible. A great one eventually disappears from your attention. You stop thinking about the interface and begin thinking about the thing you came to do.\n\n## Reduce the decisions that do not matter\n\nEvery setting and menu asks for a little energy. Some choices are valuable, but many arrive before the user understands why they matter. Thoughtful defaults let people begin, while keeping deeper control within reach.\n\nLook at a familiar task in your own work. Count the decisions between opening the tool and doing something useful. Which ones could wait? Which could the software reasonably make for you?\n\n## Trust comes from recovery\n\nSpeed is helpful, but a clear way to undo a mistake matters just as much. A tool feels calm when the user understands what happened and what they can do next. Preserve their work. Explain errors in plain language. Make destructive actions deliberate.\n\nThe goal is a working relationship in which the software carries its share of the effort.",
  },
  {
    id: "built-to-belong",
    title: "Spaces that make us feel like we belong",
    excerpt:
      "Looking beyond beautiful buildings to the small design decisions that help people feel welcome.",
    category: "Design",
    author: "Maya Chen",
    featured: 0,
    image: covers.architecture,
    content:
      "A beautiful building can still be difficult to enter. Its door may be hard to find, its signs too small, its seating arranged for a person who never seems to arrive. Welcome is made from practical details.\n\n## Begin at the threshold\n\nThe first moments in a space answer a series of quiet questions. Am I in the right place? Where should I go? Is it okay to stay? Clear entrances, visible information, and somewhere to pause help people find their bearings.\n\nGood design considers different bodies, different experiences, and different levels of familiarity. It does not assume that everyone arrives knowing the rules.\n\n## Make room for different ways of being\n\nSome people want conversation; others want a quiet corner. Some need a place to rest; others need room to move. A welcoming space offers choices without making any of them feel like an exception.\n\nThe strongest architecture is a setting for ordinary life, made more comfortable by attention to the people who use it.",
  },
  {
    id: "a-room-for-ideas",
    title: "Making a little room for big ideas",
    excerpt:
      "A creative workspace isn't about having more. It's about knowing what deserves a place on your desk.",
    category: "Creativity",
    author: "Olivia Bennett",
    featured: 0,
    image: covers.workspace,
    content:
      "A clear desk will not write the first sentence for you. But a workspace can make beginning a little easier, and beginning is often the difficult part.\n\n## Design for the work you actually do\n\nForget the photograph of the perfect studio. Think about the movements you repeat: reaching for a pencil, finding a reference, reading a page, stepping back to look at something. Arrange the space around those movements.\n\nKeep the materials for your current project visible. Store the rest nearby. A useful workspace can be messy, but it should be a mess you understand.\n\n## Leave yourself a starting point\n\nAt the end of a session, write one sentence about what comes next. Leave the file open or place the sketch where you will see it. Your future self will spend less time reconstructing the problem and more time working on it.\n\nThe best creative spaces are personal and adaptable. They give your attention somewhere to land, then let you get on with the work.",
  },
  {
    id: "a-little-less-online",
    title: "A little less online, a little more here",
    excerpt:
      "Reclaiming your attention doesn't have to mean disappearing. Start with a few small boundaries that stick.",
    category: "Culture",
    author: "Noah Williams",
    featured: 0,
    image: covers.mountains,
    content:
      "The first thing I changed was where my phone slept. Not in another building, not locked in a box. Just on a shelf across the room. That small distance made the morning feel different.\n\n## Choose a better default\n\nWe often rely on willpower to resist tools designed to be convenient. A better approach is to change what is convenient. Put a book where your phone used to be. Keep a notebook open beside your keyboard. Turn off notifications that have never delivered something urgent.\n\nThese are experiments, not rules. Notice which changes make your day feel more spacious and keep those. A boundary that works on a quiet Sunday might not work during a busy week.\n\n## Be where you are\n\nAttention is not a competition. You need enough room to hear your own thoughts and to listen when someone sits across from you.\n\nStart with one meal, one walk, or one conversation. Let it be ordinary. The reward is the experience of being present for the life you already have.",
  },
];
export const seedPosts: Post[] = stories.map((story, i) => ({
  ...story,
  category: story.category as Post["category"],
  owner: "marginly-editorial",
  status: "published",
  createdAt: `2026-10-0${6 - i}T09:00:00.000Z`,
  updatedAt: `2026-10-0${6 - i}T09:00:00.000Z`,
  likes: 0,
  liked: false,
  bookmarked: false,
  commentCount: 0,
}));
