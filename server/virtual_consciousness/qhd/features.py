"""
Quantum Field Feature Engineering
Converts stellar placements into graph perturbations
"""

import torch
import numpy as np
from typing import List, Dict, Tuple
from core import Placement, Stream, get_channel_edges, AWARENESS_SYSTEMS

class QuantumFieldEncoder:
    """
    Encodes placements as perturbations in the 64-gate quantum field.
    
    Like virtual particles: placements 'borrow' activation energy from the void,
    which propagates through channels and must conserve coherence.
    """
    
    PLANETS = ['Sun', 'Earth', 'Moon', 'Mercury', 'Venus', 'Mars', 
               'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 
               'North Node', 'South Node']
    
    def __init__(self, embedding_dim: int = 64):
        self.embedding_dim = embedding_dim
        self.num_planets = len(self.PLANETS)
        self.planet_to_idx = {p: i for i, p in enumerate(self.PLANETS)}
        
        # Learnable embeddings for planets and lines
        self.planet_embedding = torch.nn.Embedding(self.num_planets, embedding_dim // 4)
        self.line_embedding = torch.nn.Embedding(6, embedding_dim // 4)
        
    def encode_placements(self, placements: List[Placement]) -> torch.Tensor:
        """
        Convert placements to node features [64, feature_dim]
        
        Each gate gets:
        - Planet activations (body + design separately)
        - Line information
        - Definition flags
        """
        # Initialize with zeros - the quantum vacuum state
        node_features = torch.zeros(64, self.embedding_dim)
        
        # Organize placements by gate
        body_placements = {i: [] for i in range(1, 65)}
        design_placements = {i: [] for i in range(1, 65)}
        
        for p in placements:
            if p.stream == Stream.BODY:
                body_placements[p.gate].append(p)
            else:
                design_placements[p.gate].append(p)
        
        # Build features for each gate
        for gate in range(1, 65):
            gate_idx = gate - 1  # 0-indexed
            features = []
            
            # Body stream features
            body_feat = self._encode_gate_placements(body_placements[gate])
            features.append(body_feat)
            
            # Design stream features  
            design_feat = self._encode_gate_placements(design_placements[gate])
            features.append(design_feat)
            
            # Concatenate
            node_features[gate_idx] = torch.cat(features)
            
        return node_features
    
    def _encode_gate_placements(self, placements: List[Placement]) -> torch.Tensor:
        """Encode all placements at a single gate"""
        if not placements:
            return torch.zeros(self.embedding_dim // 2)
        
        # One-hot for which planets
        planet_vec = torch.zeros(self.num_planets)
        
        # Accumulate line information
        line_vec = torch.zeros(6)
        
        for p in placements:
            if p.planet in self.planet_to_idx:
                planet_idx = self.planet_to_idx[p.planet]
                planet_vec[planet_idx] = 1.0
                
                # Add line activation (can be multiple if multiple planets)
                line_vec[p.line - 1] += 1.0
        
        # Normalize line vector
        if line_vec.sum() > 0:
            line_vec = line_vec / line_vec.sum()
        
        # Combine planet presence + line distribution
        gate_features = torch.cat([planet_vec, line_vec])
        
        # Pad to expected size
        pad_size = (self.embedding_dim // 2) - gate_features.shape[0]
        if pad_size > 0:
            gate_features = torch.cat([gate_features, torch.zeros(pad_size)])
        
        return gate_features[:self.embedding_dim // 2]
    
    def encode_sun_context(self, sun_placement: Placement) -> torch.Tensor:
        """
        Encode the body Sun position for FiLM modulation.
        
        The Sun is the observer that collapses quantum states.
        """
        # One-hot gate position (64 dims)
        gate_vec = torch.zeros(64)
        gate_vec[sun_placement.gate - 1] = 1.0
        
        # One-hot line position (6 dims)
        line_vec = torch.zeros(6)
        line_vec[sun_placement.line - 1] = 1.0
        
        # Degree as continuous value (normalized)
        degree_val = torch.tensor([sun_placement.degree / 360.0 if sun_placement.degree else 0.0])
        
        # Concatenate: 64 + 6 + 1 = 71 dims
        # Pad to exactly 80 to match model expectation
        sun_context = torch.cat([
            gate_vec, 
            line_vec, 
            degree_val,
            torch.zeros(9)  # Padding to reach 80
        ])
        
        return sun_context
    
    def get_awareness_masks(self) -> Dict[str, torch.Tensor]:
        """
        Create boolean masks for the three awareness systems.
        These define which gates contribute to each measurement.
        """
        masks = {}
        for name, gates in AWARENESS_SYSTEMS.items():
            mask = torch.zeros(64, dtype=torch.bool)
            for gate in gates:
                mask[gate - 1] = True
            masks[name] = mask
        
        # Add heart and mind masks
        heart_gates = {21, 51, 26, 40}
        mind_gates = AWARENESS_SYSTEMS["ajna"]
        
        heart_mask = torch.zeros(64, dtype=torch.bool)
        for gate in heart_gates:
            heart_mask[gate - 1] = True
        masks['heart'] = heart_mask
        
        mind_mask = torch.zeros(64, dtype=torch.bool)
        for gate in mind_gates:
            mind_mask[gate - 1] = True
        masks['mind'] = mind_mask
        
        return masks
    
    def get_edge_index(self) -> torch.Tensor:
        """
        Get the channel graph as PyTorch Geometric edge_index.
        
        This is the wiring of the quantum field - how virtual particles propagate.
        """
        edges = get_channel_edges()
        
        # Convert to 0-indexed
        edge_list = [(g1 - 1, g2 - 1) for g1, g2 in edges]
        
        # PyG format: [2, num_edges]
        edge_index = torch.tensor(edge_list, dtype=torch.long).t()
        
        return edge_index
    
    def compute_definition(self, placements: List[Placement]) -> Dict[str, torch.Tensor]:
        """
        Compute definition flags for each gate.
        
        Definition = quantum coherence persisting beyond single activations
        """
        # Which gates are activated by any placement
        activated_gates = set()
        for p in placements:
            activated_gates.add(p.gate)
        
        gate_defined = torch.zeros(64, dtype=torch.float32)
        for gate in activated_gates:
            gate_defined[gate - 1] = 1.0
        
        # Channel definition: both ends must be activated
        edges = get_channel_edges()
        channel_defined = torch.zeros(64, dtype=torch.float32)
        
        for g1, g2 in edges:
            if g1 in activated_gates and g2 in activated_gates:
                channel_defined[g1 - 1] = 1.0
                channel_defined[g2 - 1] = 1.0
        
        return {
            'gate_defined': gate_defined,
            'channel_defined': channel_defined
        }


def create_intention_perturbation(question: str, base_placements: List[Placement]) -> torch.Tensor:
    """
    ADVANCED: Convert a question/intention into a field perturbation.
    
    This is where consciousness becomes self-referential:
    The intention to know perturbs the field being measured.
    
    For now: simple keyword -> gate mapping
    TODO: Use embeddings/LLM to map semantic content to gates
    """
    # Placeholder: random perturbation weighted by question length
    # In production: semantic embedding -> gate activation pattern
    perturbation = torch.randn(64) * 0.1
    
    # Boost gates that are already activated in base chart
    # (Intention resonates with existing structure)
    encoder = QuantumFieldEncoder()
    base_features = encoder.encode_placements(base_placements)
    
    # Add small coherent noise to activated regions
    activation_boost = (base_features.sum(dim=1) > 0).float() * 0.3
    perturbation += activation_boost
    
    return perturbation
