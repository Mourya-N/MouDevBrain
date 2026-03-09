package com.moucodebrain;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MouCodeBrainApplication {
    public static void main(String[] args) {
        SpringApplication.run(MouCodeBrainApplication.class, args);
    }
}