package com.moucodebrain.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/query")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173" })
public class QueryController {

    public QueryController() {
    }

    @PostMapping("/{repoId}")
    public ResponseEntity<?> query(@PathVariable String repoId, @RequestBody QueryRequest request) {
        return ResponseEntity.ok().build();
    }
}

class QueryRequest {
    private String query;
    private String context;

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getContext() {
        return context;
    }

    public void setContext(String context) {
        this.context = context;
    }
}