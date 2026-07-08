# backend/app/services/openfda.py
import requests
from typing import Dict, Any, List
from app.config.settings import OPENFDA_API_KEY
from app.rag.log import logger

class OpenFDAService:
    """Service to query OpenFDA for drug details and adverse events."""

    def __init__(self, api_key: str = OPENFDA_API_KEY):
        self.api_key = api_key
        self.label_url = "https://api.fda.gov/drug/label.json"
        self.event_url = "https://api.fda.gov/drug/event.json"

    def get_drug_details(self, drug_name: str) -> Dict[str, Any]:
        """Fetches warnings, purpose, and indications for a drug from OpenFDA labels."""
        if not drug_name:
            return {"found": False}

        params = {
            "search": f'openfda.brand_name:"{drug_name}" openfda.generic_name:"{drug_name}"',
            "limit": 1
        }
        if self.api_key:
            params["api_key"] = self.api_key

        try:
            logger.info(f"Querying OpenFDA labels for: '{drug_name}'")
            response = requests.get(self.label_url, params=params, timeout=8)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                if not results:
                    return {"found": False}
                
                result = results[0]
                brand_name = result.get("openfda", {}).get("brand_name", [drug_name.capitalize()])[0]
                generic_name = result.get("openfda", {}).get("generic_name", ["Unknown"])[0]
                
                # Extract text segments safely
                purpose = result.get("purpose", ["Purpose details not available."])[0]
                indications = result.get("indications_and_usage", ["Usage details not available."])[0]
                warnings = result.get("warnings", ["No specific warnings listed."])[0]
                dosage = result.get("dosage_and_administration", ["Dosage details not available."])[0]

                return {
                    "found": True,
                    "brand_name": brand_name,
                    "generic_name": generic_name,
                    "purpose": purpose,
                    "indications": indications,
                    "warnings": warnings,
                    "dosage_and_administration": dosage
                }
            return {"found": False}
        except Exception as e:
            logger.error(f"OpenFDA label search exception: {e}")
            return {"found": False}

    def get_adverse_events(self, drug_name: str, limit: int = 5) -> List[str]:
        """Fetches top adverse events (reported side effects) for a drug from OpenFDA events database."""
        if not drug_name:
            return []

        params = {
            "search": f'patient.drug.medicinalproduct:"{drug_name}"',
            "count": "patient.reaction.reactionmeddrapt.exact",
            "limit": limit
        }
        if self.api_key:
            params["api_key"] = self.api_key

        try:
            logger.info(f"Querying OpenFDA adverse events for: '{drug_name}'")
            response = requests.get(self.event_url, params=params, timeout=8)
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                return [r.get("term", "").title() for r in results if r.get("term")]
            return []
        except Exception as e:
            logger.error(f"OpenFDA events lookup exception: {e}")
            return []