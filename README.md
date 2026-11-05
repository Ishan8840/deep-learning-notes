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

The interactive examples use illustrative data and identify their assumptions in the interface. The graph uses actual links between the published notes. The site supports keyboard navigation, mobile layouts, and reduced-motion preferences.
