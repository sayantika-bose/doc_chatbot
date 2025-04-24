
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentService } from '../../core/services/document.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressBarModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Upload Document</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div 
          class="drop-zone" 
          [class.active]="isDragging()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)">
          <p>Drag & drop a file here or click to select</p>
          <input type="file" (change)="onFileSelected($event)" #fileInput>
        </div>
        <mat-progress-bar *ngIf="uploading()" mode="indeterminate"></mat-progress-bar>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .drop-zone { 
      border: 2px dashed #ccc; 
      padding: 20px;
      text-align: center;
      cursor: pointer;
    }
    .drop-zone.active { border-color: #2196F3; }
  `]
})
export class UploadComponent {
  uploading = signal(false);
  isDragging = signal(false);

  constructor(
    private documentService: DocumentService,
    private snackBar: MatSnackBar
  ) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.uploadFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  uploadFile(file: File) {
    this.uploading.set(true);
    this.documentService.uploadDocument(file).subscribe({
      next: (response) => {
        this.snackBar.open(`Document uploaded successfully! ID: ${response.document_id}`, 'Close', {
          duration: 5000
        });
        this.uploading.set(false);
      },
      error: (error) => {
        this.snackBar.open('Error uploading document', 'Close', {
          duration: 5000
        });
        this.uploading.set(false);
      }
    });
  }
}
