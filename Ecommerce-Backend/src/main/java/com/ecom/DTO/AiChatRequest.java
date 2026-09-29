package com.ecom.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class AiChatRequest {

    @NotBlank(message = "Message is required")
    private String message;

    private List<ChatMessage> history;

    @Data
    public static class ChatMessage {
        private String role; // "user" or "assistant"
        private String content;
    }
}
