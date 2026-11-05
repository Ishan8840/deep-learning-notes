---
title: "Vision transformers"
tags:
  - foundations
---

> [!example] Implementation
> [Browse the code](https://github.com/Ishan8840/deep-learning/tree/main/01-foundations/05-vision-transformer) on GitHub.

ViTs showed that a [Transformer](../06-transformer/index.md) trained on sequences of image patches can perform strongly on image classification, especially when pretrained at scale. This offers an alternative to [CNNs](../03-cnn/index.md); the data and compute needed depend on the training setup.

We reshape an image into a sequence of flattened 2D patches. The Transformer keeps a constant hidden size $D$ through its layers, so each flattened patch is mapped to $D$ dimensions with a trainable projection.

Learnable positional embeddings identify each patch's location.

Prepend a learnable classification token to the patch sequence. Its final representation summarizes the image for classification.

A classification head maps that token to class logits.


#### Sources
[ViT](https://arxiv.org/pdf/2010.11929)
