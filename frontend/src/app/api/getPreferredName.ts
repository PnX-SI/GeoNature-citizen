import { Taxon } from '../programs/observations/observation.model';

function getValueFromPath(taxon: Taxon, path: string): string {
    return path.split('.').reduce((acc, key) => acc && acc[key], taxon);
}

export function getPreferredName(taxon: Taxon): string {
    const priorityAttributes = [
        'nom_francais',
        'taxref.nom_vern',
        'taxref.nom_valide',
        'taxref.nom_complet',
        'taxref.lb_nom',
        'taxref.cd_nom',
    ];

    for (const attributePath of priorityAttributes) {
        const value = getValueFromPath(taxon, attributePath);
        if (value) {
            return value;
        }
    }

    return 'Unknown';
}
