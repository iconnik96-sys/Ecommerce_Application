package com.ecom.mapper;

import com.ecom.DTO.WishlistResponseDTO;
import com.ecom.entity.Wishlist;
import com.ecom.entity.WishlistItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = WishlistItemMapper.class
)
public interface WishlistMapper {

    @Mapping(source = "wishlist.id", target = "wishlistId")
    @Mapping(source = "wishlistItems", target = "items")
    WishlistResponseDTO toDTO(
            Wishlist wishlist,
            List<WishlistItem> wishlistItems
    );
}