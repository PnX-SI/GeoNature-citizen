from typing import Any, List, Optional
from .rule import Rule


def find_match(rules: List[Rule], body: Any) -> List[Rule]:
    return [rule for rule in rules if rule.matches(body)]


class Classifier:
    @staticmethod
    def tag(ruleset, search_body) -> Optional[List[str]]:
        matching_rules = find_match(ruleset, search_body)
        if matching_rules:
            return [rule.action(search_body) for rule in matching_rules]
        else:
            return None
