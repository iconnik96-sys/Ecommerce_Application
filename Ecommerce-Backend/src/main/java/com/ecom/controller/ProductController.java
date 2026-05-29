package com.ecom.controller;

import com.ecom.DTO.ProductRequestDTO;
import com.ecom.DTO.ProductResponseDTO;
import com.ecom.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/ecom/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @PostMapping("/addProduct")
    public ProductResponseDTO addProduct(@RequestBody ProductRequestDTO requestDTO){
        return productService.addProduct(requestDTO);
    }


    @GetMapping("/getAllProducts")
    public List<ProductResponseDTO> getAllProducts(){
        return productService.getAllProducts();
    }


    @GetMapping("/getByName/{name}")
    public List<ProductResponseDTO> getByName(@PathVariable String name){
        return productService.getByName(name);
    }

    @DeleteMapping("/deleteproduct/{id}")
    public String deleteProduct(@PathVariable String id){
        return productService.deleteProduct(id);
    }


}
