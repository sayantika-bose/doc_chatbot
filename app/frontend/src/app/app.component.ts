
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule],
  template: `
    <mat-toolbar color="primary">
      <span>RAG Chatbot</span>
      <nav>
        <a routerLink="/upload">Upload</a>
        <a routerLink="/chat">Chat</a>
      </nav>
    </mat-toolbar>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    nav { margin-left: 20px; }
    nav a { margin: 0 10px; color: white; text-decoration: none; }
    main { padding: 20px; }
  `]
})
export class AppComponent {}
