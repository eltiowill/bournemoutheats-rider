from datetime import datetime, timedelta
from typing import List, Optional
from models.delivery import RiderAction, RiderEfficiency, PrioritySettings
import random

class PriorityService:
    def __init__(self):
        self.settings = PrioritySettings()
    
    def calculate_efficiency(self, accepted: int, penalized_rejections: int) -> float:
        """Calculate efficiency percentage"""
        total_actions = accepted + penalized_rejections
        if total_actions == 0:
            return 100.0
        return (accepted / total_actions) * 100
    
    def calculate_points(self, accepted: int, penalized_rejections: int) -> int:
        """Calculate total points"""
        return (accepted * self.settings.points_per_acceptance) + \
               (penalized_rejections * self.settings.points_per_penalized_rejection)
    
    def check_bonus_eligibility(self, efficiency: float) -> bool:
        """Check if rider is eligible for bonus"""
        return efficiency >= self.settings.efficiency_threshold_for_bonus
    
    def is_penalty_applicable(self, preparation_start_time: datetime, current_time: datetime) -> bool:
        """Check if rejection penalty should be applied based on timing"""
        if not preparation_start_time:
            return True
        
        grace_period_end = preparation_start_time + timedelta(minutes=self.settings.preparation_grace_period_minutes)
        return current_time < grace_period_end
    
    def update_rider_efficiency(self, rider_id: str, action: str, order_id: str, 
                               preparation_start_time: Optional[datetime] = None) -> dict:
        """Update rider efficiency when they accept/reject an order"""
        current_time = datetime.utcnow()
        
        # Check if penalty applies
        penalty_applied = False
        if action == "reject" and preparation_start_time:
            penalty_applied = self.is_penalty_applicable(preparation_start_time, current_time)
        
        # Create action record
        rider_action = RiderAction(
            rider_id=rider_id,
            action=action,
            timestamp=current_time,
            order_id=order_id,
            penalty_applied=penalty_applied,
            preparation_start_time=preparation_start_time
        )
        
        return {
            "action": rider_action,
            "penalty_applied": penalty_applied,
            "timestamp": current_time
        }
    
    def get_rider_priority_score(self, efficiency: RiderEfficiency) -> float:
        """Calculate priority score for order assignment"""
        # Base score from points
        base_score = efficiency.total_points
        
        # Bonus for high efficiency
        if efficiency.bonus_eligible:
            base_score += 100  # Bonus points for efficient riders
        
        # Small random factor to break ties
        random_factor = random.uniform(0, 1)
        
        return base_score + random_factor
    
    def sort_riders_by_priority(self, riders_efficiency: List[RiderEfficiency]) -> List[RiderEfficiency]:
        """Sort riders by priority score for order assignment"""
        return sorted(
            riders_efficiency,
            key=lambda r: self.get_rider_priority_score(r),
            reverse=True
        )
    
    def get_priority_settings(self) -> PrioritySettings:
        """Get current priority settings"""
        return self.settings
    
    def update_priority_settings(self, new_settings: PrioritySettings) -> PrioritySettings:
        """Update priority settings"""
        self.settings = new_settings
        return self.settings
