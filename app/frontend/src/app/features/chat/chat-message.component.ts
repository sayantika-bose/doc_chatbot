
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="message" [class]="type">
      <div class="content" [innerHTML]="parsedContent"></div>
    </div>
  `,
  styles: [`
    .message {
      margin: 10px 0;
      padding: 10px;
      border-radius: 8px;
      max-width: 80%;
    }
    .user {
      background-color: #e3f2fd;
      margin-left: auto;
    }
    .ai {
      background-color: #f5f5f5;
      margin-right: auto;
    }
    .content ::ng-deep {
      line-height: 1.5;
    }
  `]
})
export class ChatMessageComponent {
  @Input() message = '';
  @Input() type: 'user' | 'ai' = 'user';

  get parsedContent() {
    return marked(this.message);
  }
}
