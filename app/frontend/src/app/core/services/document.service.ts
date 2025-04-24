
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  uploadDocument(file: File): Observable<{ document_id: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ document_id: string; message: string }>(
      `${this.apiUrl}/upload`,
      formData
    );
  }
}
