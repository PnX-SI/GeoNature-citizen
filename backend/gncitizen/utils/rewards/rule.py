from .fact import Fact


class Rule:
    def __init__(self, condition_fn: callable, action_fn: callable):
        self.condition = condition_fn  # When condition met
        self.action = action_fn  # Then assign category badge

    def matches(self, fact: Fact) -> bool:
        return self.condition(fact)
