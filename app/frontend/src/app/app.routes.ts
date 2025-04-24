
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'upload', loadComponent: () => import('./features/upload/upload.component').then(m => m.UploadComponent) },
  { path: 'chat', loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent) },
  { path: '', redirectTo: '/upload', pathMatch: 'full' }
];
