#!/usr/bin/env perl

=pod

=head1 NAME

targets.pl - convert spreadsheet data for use in target list

=head1 SYNOPSIS

    ./targets.pl ../output/directory

=head1 DESCRIPTION

=cut

use strict;
use warnings;
use utf8;

use JSON;
use Time::Local;

my $directory = shift @ARGV or die "Usage: targets.pl path/to/directory\n";

open my $int, '<:encoding(UTF-8)', '/tmp/daesh-targets' or die "Can't open /tmp/daesh-targets: $!\n";
my @lines = ();
while (<$int>) {
  chomp;
  push @lines, $_;
}
close $int;

# skip the header line
shift @lines;

my $targets = {};
foreach my $line (@lines) {
  chomp $line;

  my @items = split /\t/, $line;

  # make sure we have one of the target types we're interested in
  next if (!exists($items[8]) or ($items[8] eq '-' or $items[8] eq ''));
  next if $items[8] eq "Nødhjælp og ammunition";
  next unless ('kobane' eq lc $items[2] or 'kobani' eq lc $items[2]);

  my ($month, $day, $year) = split /\//, $items[3];
  my $date = sprintf "%4d-%02d-%02d", $year, $month, $day;

  my $count = 0;
  $count += $items[4] unless (!exists($items[4]) or ($items[4] eq 'x' or $items[4] eq ''));
  $count += $items[5] unless (!exists($items[5]) or ($items[5] eq 'x' or $items[5] eq ''));
  $count += $items[6] unless (!exists($items[6]) or ($items[6] eq 'x' or $items[6] eq ''));

  next unless $count;

  if (!exists $targets->{$date}->{$items[8]}) {
    $targets->{$date}->{$items[8]} = 0;
  }

  $targets->{$date}->{$items[8]} += $count;

  if (!exists $targets->{total}->{$items[8]}) {
    $targets->{total}->{$items[8]} = 0;
  }

  $targets->{total}->{$items[8]} += $count;
}

my @keys = reverse sort { $targets->{total}->{$a} <=> $targets->{total}->{$b} } keys %{$targets->{total}};

my $filename = $directory . '/targets.tsv';
open my $out, '>:encoding(UTF-8)', $filename or die "Unable to open $filename for writing: $!\n";

print $out "type\tcount\n";
foreach my $key (@keys) {
  my $tr = $key;
  $tr =~ s/ISIL-kontrollerede bygninger/ISIL-bygninger/;
  $tr =~ s/Checkpoints og kommandoposter/Checkpoints/;
  $tr =~ s/Væbnede og pansrede køretøjer/Pansrede køretøjer/;
  $tr =~ s/Ammunition og våben/Våben og ammunition/;

  print $out "$tr\t" . $targets->{total}->{$key} ."\n";
}

close $out;
