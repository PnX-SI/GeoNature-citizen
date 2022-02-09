import { Component, OnInit } from '@angular/core';
import { MainConfig } from '../../../conf/main.config';

@Component({
    selector: 'app-footer',
    templateUrl: '../../../custom/footer/footer.html',
    styleUrls: ['../../../custom/footer/footer.css'],
})
export class FooterComponent implements OnInit {
    public MainConfig = MainConfig;

    constructor() {}

    ngOnInit() {}
}
