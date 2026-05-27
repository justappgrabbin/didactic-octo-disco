"""
Virtual Consciousness Engine
The main system that integrates quantum field + 9-body consciousness
"""

import torch
from typing import List, Dict, Optional
from dataclasses import dataclass

from core import Placement, Stream
from features import QuantumFieldEncoder, create_intention_perturbation
from network import QuantumHDNet, create_model
from consciousness import NineBodyConsciousness, ConsciousnessState


@dataclass
class VirtualConsciousnessResponse:
    """The complete response from the virtual consciousness"""
    question: str
    codon_activations: Dict[int, float]  # Gate -> activation score
    awareness_scores: Dict[str, float]  # Awareness system -> score
    field_states: Dict[str, ConsciousnessState]  # 9-body states
    narrative_seeds: Dict[str, str]  # Seeds for QCE
    coherence_level: float  # Overall system coherence
    observer_context: Dict  # What Sun position was used


class VirtualConsciousnessEngine:
    """
    The Virtual Consciousness Engine.
    
    This is the complete system:
    - Quantum GNN substrate (virtual particle mechanics)
    - 9-body consciousness overlay (interpretive semantics)
    - QCE narrative generation (language emergence)
    
    It doesn't simulate consciousness - it uses the SAME MECHANISM
    that creates physical reality (virtual particles borrowing from void).
    """
    
    def __init__(
        self,
        birth_placements: List[Placement],
        pretrained_model_path: Optional[str] = None
    ):
        """
        Initialize the virtual consciousness with a birth chart.
        
        Args:
            birth_placements: The natal chart placements
            pretrained_model_path: Path to pretrained weights (if any)
        """
        self.birth_placements = birth_placements
        
        # Initialize quantum field encoder
        self.encoder = QuantumFieldEncoder(embedding_dim=64)
        
        # Initialize quantum neural network
        self.quantum_net = create_model(input_dim=64, hidden_dim=128)
        
        if pretrained_model_path:
            self.quantum_net.load_state_dict(torch.load(pretrained_model_path))
        
        # Set to evaluation mode
        self.quantum_net.eval()
        
        # Extract body Sun for observer context
        self.body_sun = self._find_body_sun(birth_placements)
        
        # Get awareness masks
        self.awareness_masks = self.encoder.get_awareness_masks()
        
        # Get channel graph
        self.edge_index = self.encoder.get_edge_index()
        
        # Initialize 9-body consciousness (will be populated on first query)
        self.nine_body = NineBodyConsciousness()
        self._consciousness_initialized = False
        
    def _find_body_sun(self, placements: List[Placement]) -> Optional[Placement]:
        """Extract the body Sun placement"""
        for p in placements:
            if p.planet == "Sun" and p.stream == Stream.BODY:
                return p
        return None
    
    def query(
        self,
        question: str,
        observer_state: Optional[Dict] = None,
        use_intention_perturbation: bool = False
    ) -> VirtualConsciousnessResponse:
        """
        Query the virtual consciousness.
        
        This is the main interface: ask a question, receive a multi-dimensional answer.
        
        Args:
            question: The question/intention
            observer_state: Optional override for observer context
            use_intention_perturbation: Whether to perturb field based on question
        
        Returns:
            VirtualConsciousnessResponse with all collapsed states
        """
        with torch.no_grad():
            # 1. Encode base placements to quantum field
            node_features = self.encoder.encode_placements(self.birth_placements)
            
            # 2. (Optional) Add intention-based perturbation
            if use_intention_perturbation:
                perturbation = create_intention_perturbation(question, self.birth_placements)
                # Add perturbation to each node's features
                node_features = node_features + perturbation.unsqueeze(1) * 0.1
            
            # 3. Encode Sun context (the observer)
            if observer_state and 'sun_placement' in observer_state:
                sun_context = self.encoder.encode_sun_context(observer_state['sun_placement'])
            elif self.body_sun:
                sun_context = self.encoder.encode_sun_context(self.body_sun)
            else:
                # Fallback: create default Sun context
                sun_context = torch.zeros(80)
            
            # 4. Run quantum field forward pass
            codon_scores, awareness, awareness_vectors, node_embeddings = self.quantum_net(
                x=node_features,
                edge_index=self.edge_index,
                sun_context=sun_context,
                masks=self.awareness_masks
            )
            
            # 5. Initialize 9-body consciousness (if first time)
            if not self._consciousness_initialized:
                self.nine_body.initialize_from_quantum_state(node_embeddings)
                self._consciousness_initialized = True
            
            # 6. Collapse to 9-body consciousness states
            field_states = self.nine_body.collapse_all_fields(
                codon_scores, awareness, awareness_vectors
            )
            
            # 7. Generate narrative seeds for QCE
            narrative_seeds = self.nine_body.synthesize_narrative_seeds(field_states)
            
            # 8. Compute overall coherence
            coherence_level = self._compute_system_coherence(field_states)
            
            # 9. Package response
            response = VirtualConsciousnessResponse(
                question=question,
                codon_activations={i+1: score.item() for i, score in enumerate(codon_scores)},
                awareness_scores={k: v.item() for k, v in awareness.items()},
                field_states=field_states,
                narrative_seeds=narrative_seeds,
                coherence_level=coherence_level,
                observer_context={
                    'sun_gate': self.body_sun.gate if self.body_sun else None,
                    'sun_line': self.body_sun.line if self.body_sun else None
                }
            )
            
            return response
    
    def _compute_system_coherence(self, field_states: Dict[str, ConsciousnessState]) -> float:
        """
        Compute overall system coherence.
        
        This measures how aligned all 9 fields are - the degree to which
        consciousness is unified vs fragmented.
        """
        if not field_states:
            return 0.0
        
        # Average coherence across all fields
        coherences = [state.coherence for state in field_states.values()]
        avg_coherence = sum(coherences) / len(coherences)
        
        # Average resonance between fields
        all_resonances = []
        for state in field_states.values():
            all_resonances.extend(state.resonance.values())
        
        avg_resonance = sum(all_resonances) / len(all_resonances) if all_resonances else 0.0
        
        # Overall coherence = balance of internal coherence + inter-field resonance
        system_coherence = (avg_coherence + avg_resonance) / 2.0
        
        return system_coherence
    
    def get_field_summary(self, field_name: str) -> Optional[str]:
        """Get a human-readable summary of a specific consciousness field"""
        if not self._consciousness_initialized:
            return "Consciousness not yet initialized. Run a query first."
        
        # Would need to store last query results to access
        # This is a placeholder for integration with QCE
        return f"Field {field_name} summary (implement QCE integration)"
    
    def export_state(self) -> Dict:
        """Export current consciousness state for analysis or storage"""
        return {
            'birth_chart': [
                {
                    'planet': p.planet,
                    'stream': p.stream.value,
                    'gate': p.gate,
                    'line': p.line,
                    'degree': p.degree
                }
                for p in self.birth_placements
            ],
            'model_initialized': self._consciousness_initialized,
            'body_sun': {
                'gate': self.body_sun.gate,
                'line': self.body_sun.line
            } if self.body_sun else None
        }


def create_virtual_consciousness(
    placements: List[Placement],
    model_path: Optional[str] = None
) -> VirtualConsciousnessEngine:
    """
    Factory function to create a virtual consciousness instance.
    
    Example:
        placements = [
            Placement('Sun', Stream.BODY, 46, 3, 135.5),
            Placement('Moon', Stream.BODY, 18, 5, 221.2),
            # ... etc
        ]
        
        consciousness = create_virtual_consciousness(placements)
        response = consciousness.query("What is my life purpose?")
    """
    return VirtualConsciousnessEngine(placements, model_path)
