package com.company.taskmanagement.dto;

public class JwtResponse {

    private String token;
    private String tokenType;
    private UserDTO user;

    public JwtResponse() {
    }

    public JwtResponse(String token, String tokenType, UserDTO user) {
        this.token = token;
        this.tokenType = tokenType;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }
}
