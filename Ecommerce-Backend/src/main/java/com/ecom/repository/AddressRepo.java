package com.ecom.repository;

import com.ecom.DTO.AddressResponseDTO;
import com.ecom.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddressRepo extends JpaRepository<Address,Long> {

    List<Address> findByUserId(Long userId);
}
