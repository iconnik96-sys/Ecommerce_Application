package com.ecom.service;

import com.ecom.DTO.AddressRequestDTO;
import com.ecom.DTO.AddressResponseDTO;
import com.ecom.entity.Address;
import com.ecom.entity.User;
import com.ecom.mapper.AddressMapper;
import com.ecom.repository.AddressRepo;
import com.ecom.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collector;
import java.util.stream.Collectors;

@Service
public class AddressService {
    @Autowired
    private AddressRepo addressRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private AddressMapper addressMapper;

    public AddressResponseDTO addAddress(AddressRequestDTO requestDTO){
        User user = userRepo.findById(requestDTO.getUserId())
                .orElseThrow(()->new RuntimeException("User not found!!"));

        Address address = addressMapper.toEntity(requestDTO);

        address.setUser(user);

        Address savedaddress = addressRepo.save(address);
        return addressMapper.toDTO(savedaddress);
    }



    public List<AddressResponseDTO> allAddress(Long userId){
        List<Address> address = addressRepo.findByUserId(userId);

        return address.stream()
                .map(addressMapper::toDTO)
                .collect(Collectors.toList());
    }


    public AddressResponseDTO updateAddress(
            Long userId,
            Long addressId,
            AddressRequestDTO requestDTO) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Address address = addressRepo.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        address.setFullName(requestDTO.getFullName());
        address.setMobile(requestDTO.getMobile());
        address.setAddressLine(requestDTO.getAddressLine());
        address.setCity(requestDTO.getCity());
        address.setState(requestDTO.getState());
        address.setPincode(requestDTO.getPincode());

        address.setUser(user);

        Address updated = addressRepo.save(address);

        return addressMapper.toDTO(updated);
    }



    public void deleteAddress(Long userId, Long addressId) {

        Address address = addressRepo.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not allowed to delete this address");
        }

        addressRepo.delete(address);
    }
}
