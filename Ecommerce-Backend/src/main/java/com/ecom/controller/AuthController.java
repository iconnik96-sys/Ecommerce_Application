    package com.ecom.controller;

    import com.ecom.DTO.*;
    import com.ecom.entity.User;
    import com.ecom.repository.UserRepo;
    import com.ecom.security.JwtService;
    import lombok.RequiredArgsConstructor;
    import org.springframework.security.crypto.password.PasswordEncoder;
    import org.springframework.web.bind.annotation.*;

    @RestController
    @RequestMapping("/auth")
    @CrossOrigin(origins = "*")
    @RequiredArgsConstructor
    public class AuthController {

        private final UserRepo userRepo;
        private final PasswordEncoder encoder;
        private final JwtService jwtService;



        @PostMapping("/login")
        public AuthResponse login(
                @RequestBody LoginRequest request
        ) {

            User user =
                    userRepo.findByEmail(
                            request.getEmail()
                    ).orElseThrow();

            if(!encoder.matches(
                    request.getPassword(),
                    user.getPassword()
            )) {

                throw new RuntimeException(
                        "Invalid password"
                );
            }

            String token =
                    jwtService.generateToken(
                            user.getEmail()
                    );

            return new AuthResponse(token);
        }
    }