---
title: "Attention"
tags:
  - foundations
---

I remember being in elementary school and asking teachers what words meant when I got stuck mid-sentence. They'd tell me to look at the words around it and infer the meaning from context.

That's a useful way to think about attention in a transformer: **each token gathers information from other tokens, weighted by their relevance.**

The model learns what relevance means. It doesn't look up a fixed rule for which words belong together; it computes a different mixture of information for each position.

## Queries, keys, and values

Each token gets three learned projections:

- **Query:** what am I looking for?
- **Key:** what do I offer that might match a query?
- **Value:** what information do I contribute if I receive attention?

For an input matrix $X$, these are

$$
Q = XW^Q, \qquad K = XW^K, \qquad V = XW^V.
$$

$W^Q$, $W^K$, and $W^V$ are learned weight matrices. $Q$, $K$, and $V$ are the projected representations of this particular input.

We take the dot product of a **query and a key**, not a key and a value. This gives a compatibility score. Softmax turns the scores into weights, and those weights mix the **values**:

$$
A = \operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}} + M\right),
\qquad
Y = AV.
$$

Softmax acts on each row. $d_k$ is the query/key dimension, and $M$ is an optional attention mask. Values can have a different dimension, $d_v$.

Why divide by $\sqrt{d_k}$? Under the usual simplifying assumption of independent, unit-variance query/key components, the dot product's variance grows with $d_k$. Scaling helps prevent very large logits from pushing softmax into a saturated region with small gradients.

## A worked example: “The cat sat”

Let's use one attention head with $d_{\text{model}} = d_k = d_v = 4$. Suppose the token representations entering the attention layer are:

```text
X = [[1, 0, 1, 0],   ← The
     [0, 2, 0, 2],   ← cat
     [1, 1, 1, 1]]   ← sat
```

These are invented vectors so we can follow the arithmetic; they are not embeddings from a trained model.

### 1. Project into Q, K, and V

For a concrete, internally consistent example, choose $W^Q = \operatorname{diag}(1, 1, 2, 1)$, $W^V = I$, and:

```text
W^K = [[0, 1, 1, 1],
       [1, 0, 0, 1],
       [0, 0, 0, 0],
       [0, 0, 0, 0]]
```

Multiplying $X$ by these matrices gives:

```text
Q                 K                 V
[1, 0, 2, 0]      [0, 1, 1, 1]      [1, 0, 1, 0]
[0, 2, 0, 2]      [2, 0, 0, 2]      [0, 2, 0, 2]
[1, 1, 2, 1]      [1, 1, 1, 2]      [1, 1, 1, 1]
```

The same projection matrices apply to every token. In this toy example, $V=X$ because we chose the identity value projection; that is not a general property of attention.

### 2. Score, scale, mask, and normalize

Compute $QK^\top$, divide by $\sqrt{d_k}=2$, and apply a **causal mask**. A position can attend to itself and earlier positions, but not future ones.

| Step | Row 1: The | Row 2: cat | Row 3: sat |
| --- | --- | --- | --- |
| Raw scores | $[2, 2, 3]$ | $[4, 4, 6]$ | $[4, 4, 6]$ |
| Divide by $\sqrt{d_k}$ | $[1, 1, 1.5]$ | $[2, 2, 3]$ | $[2, 2, 3]$ |
| Causal mask | $[1, -\infty, -\infty]$ | $[2, 2, -\infty]$ | $[2, 2, 3]$ |
| Row-wise softmax | $[1, 0, 0]$ | $[0.5, 0.5, 0]$ | $[0.212, 0.212, 0.576]$ |

For example, the final row is

$$
\frac{[e^2,e^2,e^3]}{e^2+e^2+e^3}
\approx [0.212,0.212,0.576].
$$

Those final rows are the **attention weights** shown in attention heatmaps. Each is a probability distribution over the positions the query is allowed to use. A masked score of $-\infty$ becomes a weight of zero.

Causal masking is used for autoregressive decoding. An encoder can instead use bidirectional attention and see all unmasked input positions.

### 3. Mix the values

Multiply the attention weights by $V$:

```text
Y = [[1.000, 0.000, 1.000, 0.000],
     [0.500, 1.000, 0.500, 1.000],
     [0.788, 1.000, 0.788, 1.000]]
```

For “sat,” that is

$$
y_{\text{sat}}
\approx 0.212v_{\text{The}}
+ 0.212v_{\text{cat}}
+ 0.576v_{\text{sat}}.
$$

“The” receives only its own value. “Cat” receives an equal blend of the first two values. “Sat” receives a weighted blend of all three. Calculations use the unrounded weights; displayed values are rounded.

This is the output of **one attention head**, before the output projection, residual connection, and other parts of the transformer block.

## Why multiple heads?

One head produces one set of attention weights. Multiple heads give the layer several learned ways to compare and combine the same tokens.

$$
\operatorname{head}_i
= \operatorname{Attention}(XW_i^Q, XW_i^K, XW_i^V)
$$

$$
\operatorname{MultiHead}(X)
= \operatorname{Concat}(\operatorname{head}_1,\ldots,\operatorname{head}_h)W^O.
$$

Heads can learn different patterns, such as local relationships or references to earlier words. These roles are not assigned in advance, and a head need not have one neatly interpretable job.

In the original setup, $d_k=d_v=d_{\text{model}}/h$. Splitting the width across heads keeps the leading attention computation comparable to a single full-width head. The concatenated result is mixed by the learned output projection $W^O$.

## The problem attention solves

An [RNN](../04-recurrent-networks/index.md) carries information through a sequence of hidden states. If two tokens are far apart, information and gradients must cross many recurrent steps. That sequential dependency also prevents all positions in a layer from being evaluated at once.

A [CNN](../03-cnn/index.md) processes positions in parallel, but a local kernel sees only a neighborhood. Connecting distant positions requires a sufficiently large receptive field, usually built through additional layers, larger kernels, or dilation.

Self-attention creates direct connections between allowed positions. For a known training sequence, queries, keys, and values can be computed across positions in parallel—even with a causal mask. **Autoregressive generation still produces new tokens sequentially**, because the next token is not known yet.

Dense attention has a cost: its score matrix contains $n^2$ entries for a sequence of length $n$. Direct connections remove the long recurrent path; they do not make long-context attention free.

Continue with [Transformers: Attention Is All You Need](../06-transformer/index.md) for the full block, positional information, and generation-time optimizations.

## Paper & code

- [Vaswani et al., *Attention Is All You Need* (2017)](https://arxiv.org/abs/1706.03762).
- [My one-file Transformer implementation](https://github.com/Ishan8840/deep-learning/blob/main/01-foundations/04-transformer/transformer.py).
- [Visualizing Attention](https://jalammar.github.io/visualizing-neural-machine-translation-mechanics-of-seq2seq-models-with-attention/), a companion visual explanation.
