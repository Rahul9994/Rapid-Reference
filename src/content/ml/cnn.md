**Convolutional neural networks (CNNs)** are the classic architecture for images (and also audio, video and other grid-like data). Instead of connecting every pixel to every neuron, a CNN slides small learned filters — **kernels** — across the image, detecting the same pattern wherever it appears.

## Why not a plain dense network?

A 224×224 colour image has 150,528 inputs; one dense layer of 1,000 units would need about 150 million weights, and it would have to relearn "a vertical edge" separately at every position. Convolutions fix both problems with two ideas:

- **Local connectivity** — each output looks only at a small patch (e.g. 3×3).
- **Weight sharing** — the same kernel is used at every position, so a 3×3 kernel has just 9 weights (+1 bias) no matter how large the image.

This builds in **translation equivariance**: shift the input, and the feature map shifts the same way.

## The convolution operation

Slide the kernel over the image; at each position multiply element-wise and sum (the lab animates exactly this):

$$
S(i, j) = \sum_{m}\sum_{n} I(i + m,\ j + n)\, K(m, n)
$$

(Strictly, this is *cross-correlation* — true convolution flips the kernel — but deep-learning libraries use this form and call it convolution. Since kernels are learned, the difference doesn't matter.)

```python
import numpy as np

def conv2d(image, kernel, stride=1):
    kh, kw = kernel.shape
    out_h = (image.shape[0] - kh) // stride + 1
    out_w = (image.shape[1] - kw) // stride + 1
    out = np.zeros((out_h, out_w))
    for i in range(out_h):
        for j in range(out_w):
            patch = image[i * stride:i * stride + kh, j * stride:j * stride + kw]
            out[i, j] = np.sum(patch * kernel)
    return out

image = np.zeros((6, 6))
image[:, 3:] = 1                                  # dark left half, bright right half
vertical_edge = np.array([[1, 0, -1]] * 3)        # responds to left-right change
print(conv2d(image, vertical_edge))
```

```output
[[ 0. -3. -3.  0.]
 [ 0. -3. -3.  0.]
 [ 0. -3. -3.  0.]
 [ 0. -3. -3.  0.]]
```

The output is non-zero only where the brightness changes — the edge has been detected. (Negative here because brightness *increases* to the right; ReLU or a flipped kernel would keep the positive side.)

## Output size, padding and stride

For input size $n$, kernel size $k$, padding $p$ and stride $s$:

$$
\text{output} = \left\lfloor \frac{n + 2p - k}{s} \right\rfloor + 1
$$

- **"Valid"** (no padding): the output shrinks — the lab's 8×8 input and 3×3 kernel give 6×6.
- **"Same"** padding ($p = \lfloor k/2 \rfloor$ with stride 1) keeps the size.
- **Stride 2** halves the resolution.

A conv layer with $C_{in}$ input channels and $C_{out}$ kernels of size $k \times k$ has $C_{out}(k \cdot k \cdot C_{in} + 1)$ parameters. Each kernel spans **all** input channels and produces one output feature map.

## Pooling

**Max pooling** (typically 2×2, stride 2) keeps the strongest response in each block: it halves width and height, reduces computation, and makes features tolerant to small shifts. **Average pooling** takes the mean; **global average pooling** collapses each feature map to one number before the classifier.

## A typical CNN

```diagram Conv blocks shrink space while growing channels, then a classifier head
image 32×32×3
 → [conv 3×3, 32] → ReLU → [conv 3×3, 32] → ReLU → maxpool 2×2   → 16×16×32
 → [conv 3×3, 64] → ReLU → [conv 3×3, 64] → ReLU → maxpool 2×2   →  8×8×64
 → flatten / global average pool → dense → softmax over classes
```

Early layers learn edges and colours; middle layers combine them into textures and parts; deep layers respond to whole objects. The **receptive field** — how much of the input a neuron sees — grows with depth.

```python
# The same idea in PyTorch (for reference; requires torch)
import torch.nn as nn

model = nn.Sequential(
    nn.Conv2d(3, 32, kernel_size=3, padding=1), nn.ReLU(),
    nn.MaxPool2d(2),                                  # 32x32 -> 16x16
    nn.Conv2d(32, 64, kernel_size=3, padding=1), nn.ReLU(),
    nn.MaxPool2d(2),                                  # 16x16 -> 8x8
    nn.Flatten(),
    nn.Linear(64 * 8 * 8, 10),                        # 10 classes
)
```

## Landmark architectures

| Model | Year | Key idea |
|---|---|---|
| LeNet-5 | 1998 | early CNN for handwritten digits |
| AlexNet | 2012 | deep CNN + ReLU + dropout on GPUs; won ImageNet |
| VGG | 2014 | stacks of small 3×3 convolutions |
| GoogLeNet / Inception | 2014 | parallel filters of different sizes |
| ResNet | 2015 | residual (skip) connections enable 100+ layers |
| Vision Transformer (ViT) | 2020 | attention over image patches instead of convolutions |

## Practical tips

- **Transfer learning**: start from a network pre-trained on ImageNet and fine-tune it — works well with small datasets.
- **Data augmentation**: flips, crops, rotations, colour jitter — cheap extra data.
- **Batch normalisation** and residual connections make deep CNNs train reliably.

> [!WARNING]
> - Forgetting that each kernel spans all input channels when counting parameters.
> - Miscomputing output sizes — use the formula above.
> - Training a big CNN from scratch on a few hundred images instead of fine-tuning.
> - Augmentations that change the label (flipping a "6" makes a "9"-like digit).

## Interview questions

> [!INTERVIEW] Why are CNNs better than fully connected networks for images?
> Local connectivity and weight sharing drastically reduce parameters and build in the assumption that useful patterns are local and can appear anywhere, giving translation equivariance and better generalisation.

> [!INTERVIEW] What is the output size of a 32×32 input with a 5×5 kernel, padding 2, stride 1?
> $(32 + 2\cdot 2 - 5)/1 + 1 = 32$, so 32×32 ("same" padding).

> [!INTERVIEW] What does pooling do?
> It downsamples feature maps (e.g. max over 2×2 blocks), reducing computation and adding tolerance to small translations. It has no learnable parameters.

> [!REMEMBER]
> Kernel slides → multiply-accumulate → feature map · local connectivity + weight sharing · output $= \lfloor (n + 2p - k)/s \rfloor + 1$ · ReLU → pooling · early layers edges, deep layers objects · transfer learning.
