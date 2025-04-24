
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ChatService } from '../../core/services/chat.service';
import { ChatMessageComponent } from './chat-message.component';

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    ChatMessageComponent
  ],
  template: `
    <mat-card>
      <mat-card-content>
        <div class="chat-history">
          <app-chat-message
            *ngFor="let message of messages()"
            [message]="message.content"
            [type]="message.type">
          </app-chat-message>
        </div>
        <form [formGroup]="chatForm" (ngSubmit)="sendMessage()">
          <mat-form-field appearance="fill">
            <mat-label>Document ID</mat-label>
            <input matInput formControlName="documentId">
          </mat-form-field>
          <mat-form-field appearance="fill">
            <mat-label>Your question</mat-label>
            <textarea matInput formControlName="question" rows="3"></textarea>
          </mat-form-field>
          <button mat-raised-button color="primary" [disabled]="chatForm.invalid || loading()">
            Send
          </button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .chat-history { 
      height: 400px; 
      overflow-y: auto;
      margin-bottom: 20px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  `]
})
export class ChatComponent {
  chatForm = this.fb.group({
    documentId: ['', Validators.required],
    question: ['', Validators.required]
  });

  messages = signal<ChatMessage[]>([]);
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private chatService: ChatService
  ) {}

  sendMessage() {
    if (this.chatForm.valid) {
      const { documentId, question } = this.chatForm.value;
      this.loading.set(true);
      
      this.messages.update(msgs => [...msgs, { type: 'user', content: question! }]);
      
      this.chatService.sendQuestion(documentId!, question!).subscribe({
        next: (response) => {
          this.messages.update(msgs => [...msgs, { type: 'ai', content: response.answer }]);
          this.loading.set(false);
          this.chatForm.get('question')?.reset();
        },
        error: () => {
          this.loading.set(false);
        }
      });
    }
  }
}
