
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  sendQuestion(documentId: string, question: string): Observable<{ answer: string; sources: string[] }> {
    return this.http.post<{ answer: string; sources: string[] }>(
      `${this.apiUrl}/chat`,
      { document_id: documentId, question }
    );
  }
}
