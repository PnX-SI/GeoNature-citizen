import {
    Taxon,
    TaxonomyListItem,
} from '../programs/observations/observation.model';

function getValueFromPath(
    obj: Record<string, any>,
    path: string
): string | undefined {
    return path
        .split('.')
        .reduce<any>((acc, key) => (acc ? acc[key] : undefined), obj);
}
export function getPreferredName(taxon: Taxon | TaxonomyListItem): string {
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
        if (value !== undefined && value !== null && value !== '') {
            return String(value);
        }
    }

    return 'Unknown';
}
