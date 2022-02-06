import { EventEmitter, Injectable, Output } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfig } from '../../../conf/app.config';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { saveAs } from 'file-saver';
import { Relay } from '../models';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    @Output() userEdited = new EventEmitter();
    role_id: number;
    admin = false;

    private headers: HttpHeaders = new HttpHeaders({
        'Content-Type': 'application/json',
    });

    constructor(private http: HttpClient) {
        this.getPersonalInfo()
            .toPromise()
            .then((user) => {
                if (user && user['features'] && user['features']['id_role']) {
                    this.role_id = user['features']['id_role'];
                    this.admin = user['features']['admin'];
                }
            });
    }

    getPersonalInfo() {
        const url = `${AppConfig.API_ENDPOINT}/user/info`;
        return this.http.get(url, { headers: this.headers });
    }

    getUserInfo(id) {
        const url = `${AppConfig.API_ENDPOINT}/user/${id}/info`;
        return this.http.get(url, { headers: this.headers });
    }

    getBadgeCategories(userId: number) {
        return this.http.get<Object>(
            `${AppConfig.API_ENDPOINT}/rewards/${userId}`
        );
    }

    updatePersonalData(personalInfo) {
        return this.http
            .patch(`${AppConfig.API_ENDPOINT}/user/info`, personalInfo, {
                headers: this.headers,
            })
            .pipe(
                catchError((error) => {
                    return throwError(error);
                })
            );
    }

    updateUserData(id, personalInfo) {
        console.log('up', personalInfo);

        return this.http
            .patch(`${AppConfig.API_ENDPOINT}/user/${id}/info`, personalInfo, {
                headers: this.headers,
            })
            .pipe(
                catchError((error) => {
                    return throwError(error);
                })
            );
    }

    getRelays() {
        return this.http.get<Array<Relay>>(`${AppConfig.API_ENDPOINT}/relays`);
    }

    getObservationsByUserId(userId: number) {
        return this.http.get<Object>(
            `${AppConfig.API_ENDPOINT}/observations/users/${userId}`
        );
    }

    getSitesByUserId(userId: number) {
        return this.http.get<Object>(
            `${AppConfig.API_ENDPOINT}/sites/users/${userId}`
        );
    }

    getCurrentUserAreas() {
        return this.http.get<Object>(
            `${AppConfig.API_ENDPOINT}/areas/current_user`
        );
    }

    getCurrentUserSpeciesSites() {
        return this.http.get<Object>(
            `${AppConfig.API_ENDPOINT}/areas/species_sites/current_user`
        );
    }

    getCurrentUserSpeciesSitesObs() {
        return this.http.get<Object>(
            `${AppConfig.API_ENDPOINT}/areas/observations/current_user`
        );
    }

    getAdminAreas() {
        return this.http.get<Object>(`${AppConfig.API_ENDPOINT}/areas/admin`);
    }

    getAdminSpeciesSites(areaId = null) {
        return this.http.get<Object>(
            `${AppConfig.API_ENDPOINT}/areas/species_sites/admin?area=${areaId}`
        );
    }

    getAdminSpeciesSitesObs(page = 0, pageSize = 0, id_program = 0) {
        let parameters = '?';
        if (page > 0 && pageSize > 0) {
            parameters += `page=${page}&page-size=${pageSize}&`;
        }
        parameters += `id_program=${id_program}&`;

        return this.http.get<Object>(
            `${AppConfig.API_ENDPOINT}/areas/observations/admin${parameters}`
        );
    }

    getAdminObservers() {
        return this.http.get<Object>(
            `${AppConfig.API_ENDPOINT}/areas/observers/admin`
        );
    }

    deleteObsservation(idObs: any) {
        return this.http.delete<Object>(
            `${AppConfig.API_ENDPOINT}/observations/${idObs}`
        );
    }

    deleteSite(idSite: any) {
        return this.http.delete<Object>(
            `${AppConfig.API_ENDPOINT}/sites/${idSite}`
        );
    }

    ConvertToCSV(objArray, headerList) {
        const array =
            typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
        let str = '';
        let row = '';
        for (const index in headerList) {
            row += headerList[index] + ';';
        }
        row = row.slice(0, -1);
        str += row + '\r\n';
        for (let i = 0; i < array.length; i++) {
            let line = '';
            for (const index in headerList) {
                const head = headerList[index];
                line += ';' + (array[i][head] || '');
            }
            line = line.slice(1);
            str += line + '\r\n';
        }
        return str;
    }

    downloadFile(route: string, filename: string = null): void {
        const baseUrl = AppConfig.API_ENDPOINT;
        const token = 'my JWT';
        const headers = new HttpHeaders().set(
            'authorization',
            'Bearer ' + token
        );
        this.http
            .get(baseUrl + route, { headers, responseType: 'blob' as 'json' })
            .subscribe((response: any) => {
                const dataType = response.type;
                const binaryData = [];
                binaryData.push(response);
                saveAs(new Blob(binaryData, { type: dataType }), filename);
            });
    }

    exportSites(userId: number) {
        this.downloadFile(`/sites/export/${userId}`, 'gnc_export_sites.xls');
    }

    exportAreas(userId?: number, allData = false) {
        if (!userId) {
            if (!this.role_id) {
                return;
            }
            userId = this.role_id;
        }
        this.downloadFile(
            `/areas/export/${userId}${allData ? '?all-data=true' : ''}`,
            'gnc_export_areas.xls'
        );
    }
}
