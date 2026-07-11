import { Pagination as MuiPagination } from '@mui/material';

export default function PaginationWithMUI({
  totalProducts,
  productsPerPage,
  currentPage,
  handlePaginationClick
}) {

  const count = Math.ceil(totalProducts / productsPerPage);

  return (
    <div className="pagination-controller">
      <MuiPagination

        color="primary"
        size="large"
        count={count}
        page={currentPage}
        onChange={(event, value) => handlePaginationClick(value)}
      />

      <style>
        {`
          .pagination-controller ul {
            display: flex;
            justify-content: center;
          }
          .pagination-controller li button.Mui-selected{
            color:white;
            background: #0B33A0
          }


        `}
      </style>
    </div>
  );
}
