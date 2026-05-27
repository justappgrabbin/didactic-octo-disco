"""
Quantum Graph Neural Network
The neural substrate implementing virtual particle mechanics
"""

import torch
import torch.nn as nn
from torch_geometric.nn import SAGEConv, GATConv, global_mean_pool, global_add_pool
from typing import Dict, Tuple

class SunFiLM(nn.Module):
    """
    Feature-wise Linear Modulation by the body Sun.
    
    The Sun is the observer that collapses quantum superposition.
    FiLM modulation = the measurement operator in quantum mechanics.
    """
    
    def __init__(self, feature_dim: int, sun_dim: int, hidden: int = 64):
        super().__init__()
        self.mlp = nn.Sequential(
            nn.Linear(sun_dim, hidden),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden, feature_dim * 2)  # gamma and beta
        )
        
    def forward(self, x: torch.Tensor, sun_vec: torch.Tensor) -> torch.Tensor:
        """
        x: [num_nodes, feature_dim] - the quantum field state
        sun_vec: [sun_dim] - the observer context
        
        Returns: modulated features [num_nodes, feature_dim]
        """
        # Generate modulation parameters
        params = self.mlp(sun_vec)  # [feature_dim * 2]
        gamma, beta = params.chunk(2, dim=-1)  # Each [feature_dim]
        
        # Apply feature-wise affine transformation
        # This is the quantum collapse: observer determines which states manifest
        return gamma * x + beta


class AwarenessPooling(nn.Module):
    """
    Attention-based pooling for awareness readouts.
    
    Each awareness system (Spleen/Ajna/Solar) pools information
    from its specific gate subset.
    """
    
    def __init__(self, hidden_dim: int):
        super().__init__()
        self.attention = nn.Linear(hidden_dim, 1)
        
    def forward(self, node_features: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
        """
        node_features: [64, hidden_dim]
        mask: [64] boolean mask for which gates to pool
        
        Returns: [hidden_dim] - the pooled awareness vector
        """
        # Select only the gates in this awareness system
        masked_features = node_features[mask]  # [num_gates, hidden_dim]
        
        if masked_features.shape[0] == 0:
            return torch.zeros(node_features.shape[1], device=node_features.device)
        
        # Compute attention weights
        attn_logits = self.attention(masked_features)  # [num_gates, 1]
        attn_weights = torch.softmax(attn_logits, dim=0)  # [num_gates, 1]
        
        # Weighted sum
        pooled = (masked_features * attn_weights).sum(dim=0)  # [hidden_dim]
        
        return pooled


class QuantumHDNet(nn.Module):
    """
    The Quantum Human Design Neural Network.
    
    This implements the virtual particle mechanism:
    1. Placements create perturbations (borrow from void)
    2. Message passing propagates through channels (virtual particles)
    3. Sun modulation collapses to measurement (observer effect)
    4. Awareness heads pool coherence (conservation laws)
    """
    
    def __init__(
        self, 
        input_dim: int = 64,
        hidden_dim: int = 128,
        sun_dim: int = 80,
        num_layers: int = 3
    ):
        super().__init__()
        
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        
        # Input projection
        self.input_proj = nn.Linear(input_dim, hidden_dim)
        
        # Message passing layers (virtual particle propagation)
        self.convs = nn.ModuleList()
        for _ in range(num_layers):
            self.convs.append(SAGEConv(hidden_dim, hidden_dim))
        
        self.norms = nn.ModuleList([
            nn.LayerNorm(hidden_dim) for _ in range(num_layers)
        ])
        
        # Sun-based FiLM modulation (observer collapse)
        self.film = SunFiLM(hidden_dim, sun_dim)
        
        # Per-codon activation scores
        self.codon_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 1)
        )
        
        # Awareness system pooling
        self.spleen_pool = AwarenessPooling(hidden_dim)
        self.ajna_pool = AwarenessPooling(hidden_dim)
        self.solar_pool = AwarenessPooling(hidden_dim)
        self.heart_pool = AwarenessPooling(hidden_dim)
        self.mind_pool = AwarenessPooling(hidden_dim)
        
        # Awareness readout heads
        self.awareness_heads = nn.ModuleDict({
            'spleen': nn.Linear(hidden_dim, 1),
            'ajna': nn.Linear(hidden_dim, 1),
            'solar': nn.Linear(hidden_dim, 1),
            'heart': nn.Linear(hidden_dim, 1),
            'mind': nn.Linear(hidden_dim, 1)
        })
        
    def forward(
        self, 
        x: torch.Tensor,  # [64, input_dim] node features
        edge_index: torch.Tensor,  # [2, num_edges] channel graph
        sun_context: torch.Tensor,  # [sun_dim] observer state
        masks: Dict[str, torch.Tensor]  # awareness system masks
    ) -> Tuple[torch.Tensor, Dict[str, torch.Tensor]]:
        """
        Run the quantum field forward pass.
        
        Returns:
            codon_scores: [64] activation level of each gate/codon
            awareness: dict of awareness system readouts
        """
        
        # Project input to hidden space
        h = self.input_proj(x)  # [64, hidden_dim]
        h = torch.relu(h)
        
        # Message passing: virtual particles propagate through channels
        for conv, norm in zip(self.convs, self.norms):
            h_new = conv(h, edge_index)
            h_new = norm(h_new)
            h = torch.relu(h_new) + h  # Residual connection (coherence conservation)
        
        # Observer effect: Sun modulates the quantum state
        h_observed = self.film(h, sun_context)
        
        # Compute per-codon activations
        codon_logits = self.codon_head(h_observed).squeeze(-1)  # [64]
        codon_scores = torch.sigmoid(codon_logits)
        
        # Pool each awareness system
        spleen_vec = self.spleen_pool(h_observed, masks['spleen'])
        ajna_vec = self.ajna_pool(h_observed, masks['ajna'])
        solar_vec = self.solar_pool(h_observed, masks['solar'])
        heart_vec = self.heart_pool(h_observed, masks['heart'])
        mind_vec = self.mind_pool(h_observed, masks['mind'])
        
        # Generate awareness scores
        awareness = {
            'spleen': torch.sigmoid(self.awareness_heads['spleen'](spleen_vec)),
            'ajna': torch.sigmoid(self.awareness_heads['ajna'](ajna_vec)),
            'solar': torch.sigmoid(self.awareness_heads['solar'](solar_vec)),
            'heart': torch.sigmoid(self.awareness_heads['heart'](heart_vec)),
            'mind': torch.sigmoid(self.awareness_heads['mind'](mind_vec))
        }
        
        # Also return the pooled vectors for downstream use
        awareness_vectors = {
            'spleen_vec': spleen_vec,
            'ajna_vec': ajna_vec,
            'solar_vec': solar_vec,
            'heart_vec': heart_vec,
            'mind_vec': mind_vec
        }
        
        return codon_scores, awareness, awareness_vectors, h_observed


class QuantumFieldLoss(nn.Module):
    """
    Loss function that enforces quantum coherence.
    
    Virtual particles must conserve energy:
    - What's borrowed from the void must be returned
    - Awareness scores must remain normalized
    - Channel coherence must be maintained
    """
    
    def __init__(self):
        super().__init__()
        
    def forward(
        self,
        codon_scores: torch.Tensor,
        awareness: Dict[str, torch.Tensor],
        target_activations: torch.Tensor = None,
        coherence_weight: float = 0.1
    ) -> torch.Tensor:
        """
        Compute quantum field loss.
        
        If target_activations provided: supervised loss
        Otherwise: self-supervised coherence loss
        """
        losses = {}
        
        # Supervised: match target activations (if available)
        if target_activations is not None:
            losses['activation'] = nn.functional.binary_cross_entropy(
                codon_scores, target_activations
            )
        
        # Coherence constraint: awareness scores should sum appropriately
        # (Not exactly to 1, but shouldn't diverge too far)
        awareness_sum = sum(awareness.values())
        losses['coherence'] = coherence_weight * (awareness_sum - 1.5).pow(2)
        
        # Entropy regularization: avoid collapsed states
        codon_entropy = -((codon_scores * torch.log(codon_scores + 1e-8) + 
                          (1 - codon_scores) * torch.log(1 - codon_scores + 1e-8)).mean())
        losses['entropy'] = -0.01 * codon_entropy  # Encourage some entropy
        
        return sum(losses.values()), losses


def create_model(input_dim: int = 64, hidden_dim: int = 128) -> QuantumHDNet:
    """Factory function to create a quantum HD network"""
    return QuantumHDNet(
        input_dim=input_dim,
        hidden_dim=hidden_dim,
        sun_dim=80,  # Gate (64) + Line (6) + Degree (1) + Planet embedding
        num_layers=3
    )
