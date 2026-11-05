---
title: Deep learning, from scratch
description: Visual notes and readable implementations, from gradients to robot policies.
---

<div class="home-hero">
  <div class="eyebrow">ISHAN'S FIELD NOTES · 26 STUDY PAGES</div>
  <p class="hero-title">Understand the idea.<br/>Trace the implementation.</p>
  <p class="hero-copy">A guided path through neural networks, generative models, reinforcement learning, and robot policies. Each note connects the intuition and equations to the code when I've implemented it.</p>
  <div class="hero-actions"><a class="primary-action" href="./01-foundations/">Start reading ↗</a><a class="secondary-action" href="https://github.com/Ishan8840/deep-learning">Explore the code ↗</a></div>
</div>

## Choose a path

| Chapter | Start here | Core idea |
| --- | --- | --- |
| **01 · Foundations** | [Loss functions](01-foundations/02-loss-functions/index.md) · [Attention](01-foundations/05-attention/index.md) · [Transformers](01-foundations/06-transformer/index.md) | How models learn and represent information |
| **02 · Generative models** | [VAEs](02-generative-models/02-vae/index.md) · [Diffusion](02-generative-models/03-ddpm/index.md) · [Flow matching](02-generative-models/05-flow-matching/index.md) | How to turn latent variables or noise into data |
| **03 · Reinforcement learning** | [MDPs](03-reinforcement-learning/01-markov-decision-process/index.md) · [GAE](03-reinforcement-learning/05-generalized-advantage-estimation/index.md) · [PPO](03-reinforcement-learning/06-ppo/index.md) | How agents improve from interaction |
| **04 · Robot policies** | [ACT](04-robot-policies/01-act/index.md) · [Diffusion policy](04-robot-policies/02-diffusion-policy/index.md) · [Flow policies](04-robot-policies/04-vita-flow-matching/index.md) | How models produce action sequences |

These are learning notes and compact implementations. They are not exact paper reproductions or benchmark claims. The [implementation repository](https://github.com/Ishan8840/deep-learning) contains code, run instructions, and example rollouts.
