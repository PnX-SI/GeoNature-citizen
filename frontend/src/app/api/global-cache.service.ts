import { Injectable } from '@angular/core';
import { Attribut, Media } from '../programs/observations/observation.model';

@Injectable({
    providedIn: 'root',
})
export class GlobalCacheService {
    private mediasCache: Record<number, Media> = {}; // Stockage des médias par ID
    private attributesCache: Record<number, Attribut> = {}; // Stockage des attributs par ID

    setMediasCache(data: Record<number, Media>): void {
        this.mediasCache = data;
    }

    setAttributesCache(data: Record<number, Attribut>): void {
        this.attributesCache = data;
    }

    getMediaById(id: number): Media | undefined {
        return this.mediasCache[id];
    }

    getAttributeById(id: number): Attribut | undefined {
        return this.attributesCache[id];
    }

    isMediasCacheValid(): boolean {
        return Object.keys(this.mediasCache).length > 0;
    }

    isAttributesCacheValid(): boolean {
        return Object.keys(this.attributesCache).length > 0;
    }
}
