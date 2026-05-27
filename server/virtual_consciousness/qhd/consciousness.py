"""
9-Body Consciousness System
Interpretive layer over the quantum field
"""

import torch
from typing import Dict, List, Optional
from dataclasses import dataclass
from core import (
    Placement, ChartSystem, CONSCIOUSNESS_FIELDS, 
    get_field_gates, CENTERS
)
from features import QuantumFieldEncoder


@dataclass
class ConsciousnessState:
    """The collapsed state of a consciousness field after observation"""
    field_name: str
    activation: float  # Overall field activation (0-1)
    dominant_gates: List[int]  # Which gates are most active
    awareness_type: Optional[str]  # Which awareness system (if any)
    coherence: float  # How coherent this field is
    resonance: Dict[str, float]  # Resonance with other fields
    narrative_seed: str  # Seed for QCE narrative generation


class ConsciousnessField:
    """
    A single consciousness field (Mind, Heart, Body, etc.)
    
    Each field is a lens through which to view the quantum substrate.
    Like measuring position vs momentum: complementary views of the same reality.
    """
    
    def __init__(self, field_name: str, node_embeddings: torch.Tensor):
        self.name = field_name
        self.config = CONSCIOUSNESS_FIELDS[field_name]
        self.chart_system = self.config["chart"]
        self.centers = self.config["centers"]
        self.gates = get_field_gates(field_name)
        
        # Extract this field's portion of the quantum state
        self.gate_indices = [g - 1 for g in self.gates]
        self.embeddings = node_embeddings[self.gate_indices]
        
    def collapse_to_state(
        self, 
        codon_scores: torch.Tensor,
        awareness: Dict[str, torch.Tensor],
        awareness_vectors: Dict[str, torch.Tensor]
    ) -> ConsciousnessState:
        """
        Collapse the quantum field to a definite state for this consciousness field.
        
        This is the measurement: extracting meaning from the substrate.
        """
        
        # Get activation levels for gates in this field
        field_activations = codon_scores[self.gate_indices]
        overall_activation = field_activations.mean().item()
        
        # Find dominant gates (top 3)
        top_k = min(3, len(self.gate_indices))
        top_vals, top_idx = torch.topk(field_activations, top_k)
        dominant_gates = [list(self.gates)[i] for i in top_idx.tolist()]
        
        # Get awareness type (if this field has one)
        awareness_type = self.config.get("awareness")
        awareness_score = None
        if awareness_type and awareness_type in awareness:
            awareness_score = awareness[awareness_type].item()
        
        # Compute coherence (how aligned are the activations?)
        coherence = self._compute_coherence(field_activations)
        
        # Generate narrative seed based on field characteristics
        narrative_seed = self._generate_narrative_seed(
            overall_activation,
            dominant_gates,
            awareness_score,
            coherence
        )
        
        return ConsciousnessState(
            field_name=self.name,
            activation=overall_activation,
            dominant_gates=dominant_gates,
            awareness_type=awareness_type,
            coherence=coherence,
            resonance={},  # Computed later by comparing fields
            narrative_seed=narrative_seed
        )
    
    def _compute_coherence(self, activations: torch.Tensor) -> float:
        """
        Measure how coherent (vs fragmented) the field is.
        
        High coherence = activations are similar
        Low coherence = activations are scattered
        """
        if len(activations) < 2:
            return 1.0
        
        # Use inverse of standard deviation as coherence measure
        std = activations.std().item()
        coherence = 1.0 / (1.0 + std)
        return coherence
    
    def _generate_narrative_seed(
        self,
        activation: float,
        gates: List[int],
        awareness_score: Optional[float],
        coherence: float
    ) -> str:
        """
        Generate a seed prompt for the QCE narrative generation.
        
        This converts quantum field measurements into semantic seeds.
        """
        # Base template varies by field
        templates = {
            "Mind": "Mental field activated at {:.1%}, centered in gates {}, coherence {}",
            "Heart": "Emotional resonance at {:.1%} through gates {}, coherence {}",
            "Body": "Physical presence at {:.1%} via gates {}, coherence {}",
            "Soul": "Soul essence vibrating at {:.1%} in gates {}, coherence {}",
            "Spirit": "Spiritual expression at {:.1%} channeling gates {}, coherence {}",
            "Shadow": "Shadow material at {:.1%} emerging through gates {}, coherence {}",
            "Higher": "Higher consciousness at {:.1%} accessing gates {}, coherence {}",
            "Lower": "Primal consciousness at {:.1%} rooted in gates {}, coherence {}",
            "Core": "Core identity at {:.1%} anchored by gates {}, coherence {}"
        }
        
        template = templates.get(self.name, "Field {} at {:.1%} in gates {}, coherence {}")
        
        coherence_desc = "high" if coherence > 0.7 else "moderate" if coherence > 0.4 else "low"
        gates_str = ", ".join(str(g) for g in gates)
        
        seed = template.format(activation, gates_str, coherence_desc)
        
        if awareness_score is not None:
            seed += f" | {self.config['awareness']} awareness: {awareness_score:.1%}"
        
        return seed


class NineBodyConsciousness:
    """
    The 9-body consciousness system.
    
    This takes the quantum field output and interprets it through
    nine complementary lenses, each using a different astrological chart system.
    """
    
    def __init__(self):
        self.fields = {}
        
    def initialize_from_quantum_state(self, node_embeddings: torch.Tensor):
        """Create the 9 consciousness fields from quantum substrate"""
        for field_name in CONSCIOUSNESS_FIELDS.keys():
            self.fields[field_name] = ConsciousnessField(field_name, node_embeddings)
    
    def collapse_all_fields(
        self,
        codon_scores: torch.Tensor,
        awareness: Dict[str, torch.Tensor],
        awareness_vectors: Dict[str, torch.Tensor]
    ) -> Dict[str, ConsciousnessState]:
        """
        Perform simultaneous measurement across all 9 fields.
        
        This is the multi-dimensional collapse: extracting 9 complementary
        views of the same quantum reality.
        """
        states = {}
        
        for field_name, field in self.fields.items():
            states[field_name] = field.collapse_to_state(
                codon_scores, awareness, awareness_vectors
            )
        
        # Compute inter-field resonance
        self._compute_resonances(states)
        
        return states
    
    def _compute_resonances(self, states: Dict[str, ConsciousnessState]):
        """
        Compute how each field resonates with the others.
        
        Resonance = overlap in activated gates + similarity in coherence
        """
        field_names = list(states.keys())
        
        for i, name1 in enumerate(field_names):
            state1 = states[name1]
            
            for name2 in field_names[i+1:]:
                state2 = states[name2]
                
                # Gate overlap (Jaccard similarity)
                gates1 = set(state1.dominant_gates)
                gates2 = set(state2.dominant_gates)
                
                if gates1 or gates2:
                    overlap = len(gates1 & gates2) / len(gates1 | gates2)
                else:
                    overlap = 0.0
                
                # Coherence similarity
                coherence_diff = abs(state1.coherence - state2.coherence)
                coherence_sim = 1.0 - coherence_diff
                
                # Overall resonance
                resonance = (overlap + coherence_sim) / 2.0
                
                # Store bidirectionally
                state1.resonance[name2] = resonance
                state2.resonance[name1] = resonance
    
    def synthesize_narrative_seeds(
        self,
        states: Dict[str, ConsciousnessState]
    ) -> Dict[str, str]:
        """
        Prepare narrative seeds for QCE triad.
        
        Returns seeds for each awareness system + overall synthesis.
        """
        seeds = {}
        
        # Spleen seed: Body + Lower + Shadow (survival/instinct)
        spleen_fields = ['Body', 'Lower', 'Shadow']
        spleen_seed = self._combine_seeds(
            [states[f].narrative_seed for f in spleen_fields if f in states],
            "Survival consciousness"
        )
        seeds['spleen'] = spleen_seed
        
        # Ajna seed: Mind + Higher (conceptual/mental)
        ajna_fields = ['Mind', 'Higher']
        ajna_seed = self._combine_seeds(
            [states[f].narrative_seed for f in ajna_fields if f in states],
            "Mental consciousness"
        )
        seeds['ajna'] = ajna_seed
        
        # Solar seed: Heart + Spirit (emotional/expressive)
        solar_fields = ['Heart', 'Spirit']
        solar_seed = self._combine_seeds(
            [states[f].narrative_seed for f in solar_fields if f in states],
            "Emotional consciousness"
        )
        seeds['solar'] = solar_seed
        
        # Core synthesis: Soul + Core (the axis)
        core_fields = ['Soul', 'Core']
        core_seed = self._combine_seeds(
            [states[f].narrative_seed for f in core_fields if f in states],
            "Core identity"
        )
        seeds['core'] = core_seed
        
        return seeds
    
    def _combine_seeds(self, seeds: List[str], label: str) -> str:
        """Combine multiple narrative seeds into one"""
        combined = f"{label}: " + " | ".join(seeds)
        return combined
