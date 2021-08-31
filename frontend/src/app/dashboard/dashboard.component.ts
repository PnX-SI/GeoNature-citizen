import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppConfig } from '../../conf/app.config';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
    constructor(private router: Router, private titleService: Title) {}

    ngOnInit(): void {
        //this.router.navigateByUrl('home');
        this.titleService.setTitle(`${AppConfig.appName} - tableau de bord`);
    }
}
