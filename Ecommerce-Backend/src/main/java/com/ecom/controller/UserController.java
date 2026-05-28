package com.ecom.controller;

import com.ecom.DTO.UserRequestDTO;
import com.ecom.DTO.UserResponseDTO;
import com.ecom.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/ecom/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public UserResponseDTO adduser(@RequestBody UserRequestDTO user){
        return userService.adduser(user);
    }

    @GetMapping("/getall")
    public List<UserResponseDTO> getalluser(){
        return userService.getalluser();
    }

    @GetMapping("/getbyemail/{email}")
    public UserResponseDTO getbyemail(@PathVariable String email){
        return userService.getbyemail(email);
    }

    @PutMapping("/editinfo/{email}")
    public UserResponseDTO  editinfo(@PathVariable String email,@RequestBody UserRequestDTO dto){
        return userService.edituser(dto,email);
    }

    @DeleteMapping("/deleteuser/{email}")
    public String deleteuser(@PathVariable String email){
        return userService.deleteuser(email);
    }

}

