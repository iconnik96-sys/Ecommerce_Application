package com.ecom.repository;

import com.ecom.DTO.ProductResponseDTO;
import com.ecom.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepo extends JpaRepository<Product, Long> {
    List<Product> findByNameContainingIgnoreCase(String name);


}
