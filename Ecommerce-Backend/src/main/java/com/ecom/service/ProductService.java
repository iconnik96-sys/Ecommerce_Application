package com.ecom.service;

import com.ecom.DTO.ProductRequestDTO;
import com.ecom.DTO.ProductResponseDTO;
import com.ecom.entity.Product;
import com.ecom.mapper.ProductMapper;
import com.ecom.repository.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductMapper productMapper;
    @Autowired
    private ProductRepo productRepo;

    public ProductResponseDTO addProduct(ProductRequestDTO requestDTO){
        Product product = productMapper.toEntity(requestDTO);
        Product saveproduct = productRepo.save(product);
        return productMapper.toDTO(saveproduct);
    }

    public List<ProductResponseDTO> getAllProducts(){
        List<Product> products= productRepo.findAll();
       return  products.stream()
                .map(productMapper::toDTO)
                .toList();

    }

    public List<ProductResponseDTO> getByName(String name){
        List <Product> products = productRepo.findByNameContainingIgnoreCase(name);
        return products.stream()
                .map(productMapper::toDTO)
                .toList();
    }

    public  String deleteProduct(Long id){
        Product existingproduct = productRepo.findById(id)
                .orElseThrow(()->new RuntimeException("Product not found!!!"+id));
        productRepo.delete(existingproduct);
        return "Product deleted successfully";
    }

}
