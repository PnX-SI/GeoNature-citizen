import { SafeHtml } from '@angular/platform-browser';

export class Program {
    id_program: number;
    title: string;
    short_desc: string;
    long_desc: string;
    html_short_desc: SafeHtml;
    html_long_desc: SafeHtml;
    image: string;
    logo: string;
    id_module: number;
    module: any;
    taxonomy_list: number;
    registration_required: boolean;
    on_sidebar: boolean;
}
