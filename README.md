# Field Notes

Ishan’s visual guide to deep learning: 26 study notes, a graph built from their links, and interactive explanations of attention, diffusion, gradient descent, flow matching, convolution, and advantage estimation.

[Read the site](https://ishan8840.github.io/deep-learning-notes/) · [Implementations](https://github.com/Ishan8840/deep-learning)

## Edit and preview

The published Markdown lives in `content/`. You can open this folder in Obsidian. Original notes in the existing Obsidian vault remain untouched; edits to that vault do not automatically sync here.

```bash
npm ci
node scripts/content.mjs
npm run dev
```

After editing Markdown, run `node scripts/content.mjs` to regenerate the local preview data. `npm run build` does this automatically and produces `dist/`. Push to `main` to publish through GitHub Pages.

## Reading and visual explanations

The home page pairs four expandable chapters with an Obsidian-inspired graph. Its edges come from actual note links. Drag nodes to rearrange them, drag the background to pan, and use the wheel, pinch, or buttons to zoom. Hover or keyboard-focus a node to reveal its connections. Expanding a chapter highlights its notes in the map.

Twenty-two notes have short, seekable visual explanations. Every film shares playback, replay, offscreen pausing, and reduced-motion behavior. These include convolution, VAE and autoencoder bottlenecks, attention and causal masking, patch tokenization, recurrence, LoRA, contrastive matching, expert routing, diffusion, flow matching, MDP interaction, GAE, PPO clipping, and action chunks. Learning rate, query token, lambda, and advantage controls expose useful comparisons.

The diagrams distinguish computed toy examples from schematic illustrations. They do not present illustrative reconstructions, similarities, or action trajectories as trained model outputs. Pages without a film retain their notes and existing diagrams.

The interface is monochrome, with color reserved for visualization roles. Mobile layouts and keyboard navigation are supported.

## Visualization code

- `src/films.js`: shared player, CNN/VAE scenes, and explicit note-to-film mappings.
- `src/mechanisms.js`: other mechanism scenes and small numerical examples.
- `src/graph.js`: deterministic force layout, graph interaction, and label placement.
- `src/main.js`: note navigation, chapter browsing, and search.

Run `npm test` for numerical examples and `npm run build` for the production bundle.
