package com.ecom.controller;

import com.ecom.DTO.AddressRequestDTO;
import com.ecom.DTO.AddressResponseDTO;
import com.ecom.service.AddressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ecom/address")
@CrossOrigin("*")
public class AddressController {

    @Autowired
    private AddressService service;

    @PostMapping("/add")
    public AddressResponseDTO addAddress(@RequestBody AddressRequestDTO requestDTO){
        return service.addAddress(requestDTO);
    }

    @GetMapping("/getAll/{userId}")
    public List<AddressResponseDTO> getAllAddress(@PathVariable  Long userId){
        return service.allAddress(userId);
    }

    @PutMapping("/update/{userId}/{addressId}")
    public AddressResponseDTO updateAddress(@PathVariable Long userId,
                                            @PathVariable Long addressId,
                                            @RequestBody AddressRequestDTO requestDTO){
        return service.updateAddress(userId,addressId,requestDTO);
    }

    @DeleteMapping("delete/{userId}/{addressId}")
    public void deleteAddress(@PathVariable Long userId,
                              @PathVariable Long addressId){
         service.deleteAddress(userId,addressId);
    }
}
