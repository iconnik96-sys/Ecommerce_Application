package com.ecom.mapper;

import com.ecom.DTO.UserRequestDTO;
import com.ecom.DTO.UserResponseDTO;
import com.ecom.entity.User;
import com.ecom.enums.Role;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    User toEntity(UserRequestDTO user);

    UserResponseDTO toDTO(User user);

    // Explicit conversion only for role

    default Role mapStringToRole(String role) {
        return role != null ? Role.valueOf(role.toUpperCase()) : null;
    }

    default String mapRoleToString(Role role) {
        return role != null ? role.name() : null;
    }
}