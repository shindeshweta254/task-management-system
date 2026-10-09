
package com.company.taskmanagement.security;

import java.io.IOException;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private UserRepository userRepository;

           
                          
                                @Override
protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain)
        throws ServletException, IOException {

    String path = request.getServletPath();
    System.out.println("========== JWT FILTER ==========");
    System.out.println("REQUEST PATH: " + path);

    // LOGIN / AUTH endpoints are completely public.
    // Do not check JWT or X-User-Id here.
    if (path.equals("/api/auth/login")) {
        filterChain.doFilter(request, response);
        return;
    }

    // For all other protected endpoints, first try JWT.
    if (SecurityContextHolder.getContext().getAuthentication() == null) {

        String token = getTokenFromRequest(request);

        System.out.println("TOKEN FOUND: " + StringUtils.hasText(token));

        if (StringUtils.hasText(token) && jwtUtil.validateToken(token)) {
            System.out.println("TOKEN VALIDATED SUCCESSFULLY");

            String username = jwtUtil.extractUsername(token);
            System.out.println("JWT USERNAME: " + username);

            UserDetails userDetails =
                    customUserDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource()
                            .buildDetails(request)
            );

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);

        }
    }
    filterChain.doFilter(request, response);
}
     
    private String getTokenFromRequest(HttpServletRequest request) {

        String bearerToken =
                request.getHeader("Authorization");

        if (StringUtils.hasText(bearerToken)
                && bearerToken.startsWith("Bearer ")) {

            return bearerToken.substring(7);
        }

        return null;
    }
}


