package com.ecom.service;

import com.ecom.DTO.UserRequestDTO;
import com.ecom.DTO.UserResponseDTO;
import com.ecom.entity.User;
import com.ecom.mapper.UserMapper;
import com.ecom.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private UserMapper userMapper;

    public UserResponseDTO adduser(UserRequestDTO requestDTO){
        User user=userMapper.toEntity(requestDTO);
        User saveduser=userRepo.save(user);
        return userMapper.toDTO(saveduser);
    }

    public List<UserResponseDTO> getalluser(){

        List<User> alluser=userRepo.findAll();
        return alluser.stream()
                .map(userMapper::toDTO)
                .toList();
    }

    public UserResponseDTO getbyemail(String email){
    User user = userRepo.findByEmail(email)
            .orElseThrow(()->new RuntimeException("User not found:"+email));
            return userMapper.toDTO(user);
    }

    public UserResponseDTO edituser(UserRequestDTO dto,String email){
        User existinguser=userRepo.findByEmail(email)
                .orElseThrow(()->new RuntimeException("email not found "+email));

        existinguser.setName(dto.getName());
        existinguser.setPassword(dto.getPassword());

        User updateduser=userRepo.save(existinguser);
        return userMapper.toDTO(updateduser);
    }

    public String deleteuser(String email){
        User existinguser = userRepo.findByEmail(email)
                .orElseThrow(()->new RuntimeException("User not found : "+email));

        userRepo.delete(existinguser);
        return "user deleted";
    }


}
