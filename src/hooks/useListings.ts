"use client";

import { useStore } from "@/lib/store";
import { Listing } from "@/lib/store";

export function useListings() {
  const { listings, addListing, listingsPage, listingsPerPage, setListingsPage } = useStore();

  const getPaginatedListings = (filteredListings: Listing[]) => {
    const totalPages = Math.ceil(filteredListings.length / listingsPerPage);
    const paginatedListings = filteredListings.slice(
      (listingsPage - 1) * listingsPerPage,
      listingsPage * listingsPerPage
    );
    return { paginatedListings, totalPages };
  };

  return {
    listings,
    addListing,
    listingsPage,
    listingsPerPage,
    setListingsPage,
    getPaginatedListings,
  };
}
