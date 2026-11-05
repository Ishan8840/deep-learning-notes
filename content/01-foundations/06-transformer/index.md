---
title: "Transformers"
tags:
  - foundations
---

> [!example] Implementation
> [My one-file Transformer](https://github.com/Ishan8840/deep-learning/blob/main/01-foundations/04-transformer/transformer.py) is a character-level, decoder-only language model adapted from my nanoGPT repo.

## Attention Is All You Need

The idea that stuck with me is simple: a word makes more sense when it can gather context from the words around it. The [Attention note](../05-attention/index.md) develops that intuition and works through “The cat sat,” from query/key scores to a weighted sum of values.

The transformer turns that operation into a sequence model. *Attention Is All You Need* introduced an encoder–decoder architecture built from attention and feed-forward layers, without recurrent or convolutional layers in the sequence-processing stacks.

Attention mixes information **across tokens**. The rest of the block transforms that information, preserves a residual path, and keeps activations well scaled.

## The full block: residuals, normalization, FFN

### Residual connections

Each sublayer contributes an update to the representation it receives:

$$
x + \operatorname{Sublayer}(x).
$$

This gives information and gradients a direct route through the block. The sublayer can learn a refinement instead of having to reconstruct the entire incoming representation.

### Post-norm and pre-norm

The original paper applies layer normalization **after** adding the residual. A pre-norm block applies it **before** the sublayer:

```text
Post-norm:  LayerNorm(x + Sublayer(x))
Pre-norm:   x + Sublayer(LayerNorm(x))
```

These expressions omit dropout for clarity. LayerNorm normalizes each token across its feature dimension, then applies learned scale and shift parameters.

In pre-norm, the residual branch passes $x$ directly around the normalized sublayer. Each block adds an update to that stream; the stream still changes as those updates accumulate. In post-norm, normalization also acts on the merged residual result.

That placement affects gradient behavior and optimization. [Xiong et al.](https://arxiv.org/abs/2002.04745) analyze the difference, including why the original post-norm design benefits from learning-rate warm-up. My implementation uses pre-norm blocks and a final LayerNorm.

### Position-wise feed-forward network

After attention mixes context across positions, an FFN processes each token's representation separately:

$$
\operatorname{FFN}(x)=\max(0,xW_1+b_1)W_2+b_2.
$$

That is the original paper's two-layer ReLU FFN. Its parameters are shared across sequence positions, but this sublayer does not mix one position with another. My implementation also uses ReLU.

A simplified pre-norm block is:

```text
x = x + Attention(LayerNorm(x))
x = x + FFN(LayerNorm(x))
```

## Encoder, decoder, and cross-attention

The original base model has six encoder layers and six decoder layers. “Identical layers” means the same structure, not shared weights between layers.

| Stack | Sublayers in each layer | What attention can read |
| --- | --- | --- |
| Encoder | Self-attention, FFN | All unmasked source positions |
| Decoder | Masked self-attention, cross-attention, FFN | Earlier/current target positions, then encoder outputs |

In **cross-attention**, queries come from the decoder, while keys and values come from the encoder's representations of the source sequence. This lets a translation decoder consult the input sentence as it produces the output sentence.

A GPT-style **decoder-only** model uses causal self-attention and an FFN, without a separate encoder or encoder–decoder cross-attention. That is the variant in my code, rather than a reproduction of the original translation architecture.

Causal masking lets known training positions be processed in parallel without revealing future targets. At generation time, the model must still generate one new token before it can use that token to predict the next one.

## Positional information

Unmasked self-attention without positional information is **permutation-equivariant**: reorder the input tokens, and the output token representations reorder in the same way. The operation does not itself attach a first, second, or third position to each token.

That's the issue behind examples like “dog bites man” and “man bites dog.” We need the model to represent where tokens occur, not just which tokens are present. A causal mask restricts access to future positions; positional representations supply an explicit position signal.

The original paper adds sinusoidal vectors to the input embeddings:

$$
\operatorname{PE}(pos,2i)=\sin\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right),
$$

$$
\operatorname{PE}(pos,2i+1)=\cos\left(\frac{pos}{10000^{2i/d_{\text{model}}}}\right).
$$

Different feature pairs use different frequencies. The paper also experiments with learned positional embeddings; my implementation uses learned embeddings.

Other approaches put position information into attention more directly:

- **[RoPE](https://arxiv.org/abs/2104.09864):** rotates query and key components according to their positions, making their dot products sensitive to relative position.
- **[ALiBi](https://arxiv.org/abs/2108.12409):** adds a head-specific distance penalty to attention scores.

These are different mechanisms, rather than interchangeable names for adding a vector to the input.

## KV caching

A decoder-only model generates text one token at a time. Re-running the entire prefix for every next-token prediction recomputes keys and values for tokens we have already processed.

With causal attention, an earlier token's representation does not depend on tokens added later. We can therefore keep its **keys and values at every layer** in a cache.

At the next generation step:

1. Compute the new token's query, key, and value at the current layer.
2. Append its key and value to that layer's cache.
3. Let the new query attend to the cached keys, then mix the corresponding values.
4. Repeat through the remaining layers and predict the next token.

For fixed head width and a prefix of length $t$, computing attention for the **new query** takes $O(t)$ score comparisons. Recomputing full-prefix attention would use $O(t^2)$ pairs. This is the scope of the “quadratic to linear per step” comparison; it does not make the whole generation process linear. Across a growing sequence, cached decoding still accumulates a quadratic number of attention comparisons, and prompt prefill processes the prompt separately.

The tradeoff is memory. For a fixed model and numerical precision, cache size grows linearly with sequence length and with the number of KV heads. My small implementation recomputes the context during generation; it does **not** implement a KV cache.

## Grouped-query attention

Standard multi-head attention gives each query head its own key and value head. If a layer has 32 query heads, it also has 32 KV heads to cache.

**Multi-query attention (MQA)** shares one key head and one value head across all query heads. **Grouped-query attention (GQA)** shares keys and values within groups instead:

| Example with 32 query heads | KV heads | Query heads per KV head | Relative KV-cache size |
| --- | ---: | ---: | ---: |
| Multi-head attention | 32 | 1 | $1\times$ |
| Grouped-query attention | 8 | 4 | $1/4\times$ |
| Multi-query attention | 1 | 32 | $1/32\times$ |

The cache comparison assumes the same head dimension, number of layers, sequence length, batch size, and numerical precision. It describes KV storage, not a proportional reduction in the entire model or all its computation.

Sharing reduces cache memory and the bandwidth needed to read it. The [GQA paper](https://arxiv.org/abs/2305.13245) reports that its uptrained GQA models retain quality close to multi-head attention with speed comparable to MQA. The quality–efficiency tradeoff depends on the model and training; fewer KV heads do not imply a fixed quality penalty.

GQA is a later development, not part of the 2017 Transformer. My implementation uses ordinary multi-head attention.

## Paper & code

- [Vaswani et al., *Attention Is All You Need* (2017)](https://arxiv.org/abs/1706.03762).
- [My one-file Transformer implementation](https://github.com/Ishan8840/deep-learning/blob/main/01-foundations/04-transformer/transformer.py) and [run instructions](https://github.com/Ishan8840/deep-learning/tree/main/01-foundations/04-transformer).
- [Attention: intuition and worked example](../05-attention/index.md).
